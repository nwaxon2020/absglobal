"use client";

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { 
  MdAdd as Plus, 
  MdCloudUpload as Upload, 
  MdInsertLink as LinkIcon, 
  MdSave as Save, 
  MdClose as X, 
  MdDelete as Delete,
  MdWarning as Warning,
  MdEdit as Edit,
  MdCollections as Gallery,
  MdLocalOffer as Tag,
  MdBlock
} from 'react-icons/md';

import toast from 'react-hot-toast';
import { FiUser } from 'react-icons/fi';

interface VariantImage {
  id: string;
  url: string;
  file?: File;
}

interface ProductVariant {
  id: string;
  colorName: string;
  colorCode: string;
  images: VariantImage[]; 
  ram: string;
  rom: string;
  battery: string; 
  camera: string;  
  price: string;
}

export default function AddProductPageUi() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const initialForm = {
    category: 'phone' as 'phone' | 'accessory' | 'laptop' | 'smartwatch' | 'bluetooth' | 'others',
    name: '',
    model: '',
    description: '',
    isHero: false,
    isPromo: false,
    promoOldPrice: '',
    isLatest: true,
  };

  const initialVariant = { 
    id: Date.now().toString(), 
    colorName: '', 
    colorCode: '#3b82f6', 
    images: [{ id: 'img-1', url: '' }], 
    ram: '', 
    rom: '', 
    battery: '', 
    camera: '', 
    price: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [variants, setVariants] = useState<ProductVariant[]>([initialVariant]);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("serverTimestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleCancelUpdate = () => {
    setEditingId(null);
    setFormData(initialForm);
    setVariants([initialVariant]);
    toast.success("Edit cancelled");
  };

  const handleAddVariant = () => {
    setVariants([{ 
        ...initialVariant,
        id: Date.now().toString(), 
        images: [{ id: Date.now().toString() + "-img", url: '' }],
    }, ...variants]);
  };

  const removeVariant = (id: string) => {
    if (variants.length > 1) {
      setVariants(variants.filter(v => v.id !== id));
    }
  };

  const updateVariant = (id: string, field: keyof ProductVariant, value: any) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleAddImageToVariant = (variantId: string) => {
    setVariants(prev => prev.map(v => 
      v.id === variantId ? { ...v, images: [...(v.images || []), { id: Date.now().toString(), url: '' }] } : v
    ));
  };

  const handleRemoveImageFromVariant = (variantId: string, imageId: string) => {
    setVariants(prev => prev.map(v => 
      v.id === variantId ? { ...v, images: (v.images || []).filter(img => img.id !== imageId) } : v
    ));
  };

  const handleVariantFileChange = (variantId: string, imageId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setVariants(prev => prev.map(v => 
        v.id === variantId ? { 
            ...v, 
            images: (v.images || []).map(img => img.id === imageId ? { ...img, url: previewUrl, file: file } : img) 
        } : v
      ));
    }
  };

  const handleVariantUrlChange = (variantId: string, imageId: string, url: string) => {
    setVariants(prev => prev.map(v => 
        v.id === variantId ? { 
            ...v, 
            images: (v.images || []).map(img => img.id === imageId ? { ...img, url: url } : img) 
        } : v
      ));
  };

  const handleDeleteProduct = async (id: string) => {
    const tId = toast.loading("Deleting product...");
    try {
      await deleteDoc(doc(db, "products", id));
      setShowDeleteConfirm(null);
      toast.success("Product deleted", { id: tId });
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const prepareEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      category: product.category,
      name: product.name,
      model: product.model,
      description: product.description,
      isHero: product.isHero || false,
      isPromo: product.isPromo || false,
      promoOldPrice: product.promoOldPrice || '',
      isLatest: product.isLatest || false,
    });
    
    const sanitizedVariants = (product.variants || []).map((v: any) => {
        if (!v.images && v.imageUrl) {
            return {
                ...v,
                images: [{ id: `legacy-${Date.now()}`, url: v.imageUrl }]
            };
        }
        return { ...v, images: v.images || [] };
    });

    setVariants(sanitizedVariants);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return toast.error("Product Name is required");
    
    for (const v of variants) {
        if (!v.price) return toast.error("Each variant must have a price");
        if (!v.images || v.images.length === 0 || !v.images[0].url) {
            return toast.error("Each variant must have at least one image");
        }
    }

    setLoading(true);
    const tId = toast.loading(editingId ? "Updating..." : "Uploading...");

    try {
      const finalVariants = await Promise.all(variants.map(async (v) => {
        const finalImages = await Promise.all((v.images || []).map(async (img) => {
            if (img.file) {
                const storageRef = ref(storage, `products/${Date.now()}_img`);
                await uploadBytes(storageRef, img.file);
                const uploadUrl = await getDownloadURL(storageRef);
                return { id: img.id, url: uploadUrl };
            }
            return { id: img.id, url: img.url };
        }));

        return { 
          id: v.id,
          colorName: v.colorName, 
          colorCode: v.colorCode, 
          images: finalImages,
          ram: v.ram,
          rom: v.rom,
          battery: v.battery,
          camera: v.camera,
          price: Number(v.price),
        };
      }));

      const productData = {
        ...formData,
        promoOldPrice: formData.isPromo ? Number(formData.promoOldPrice) : null,
        variants: finalVariants,
        updatedAt: serverTimestamp(),
        serverTimestamp: serverTimestamp() 
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
        toast.success("Updated!", { id: tId });
        setEditingId(null);
      } else {
        await addDoc(collection(db, "products"), {
            ...productData,
            likes: 0,
            rating: 5.0,
            reviews: [],
            createdAt: new Date().toISOString(),
        });
        toast.success("Added!", { id: tId });
      }

      setFormData(initialForm);
      setVariants([initialVariant]);
      
    } catch (error) {
      toast.error("Process failed", { id: tId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative font-sans">
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center border-t-4 border-red-500">
            <Warning size={40} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-900 uppercase italic text-[12px]">Confirm Delete</h3>
            <p className="text-slate-500 text-[10px] mb-6 font-bold uppercase tracking-widest">This action is permanent.</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="py-3 bg-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-600">Cancel</button>
              <button onClick={() => handleDeleteProduct(showDeleteConfirm)} className="py-3 bg-red-500 rounded-xl text-[10px] font-black uppercase text-white shadow-lg shadow-red-200">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="px-3 py-8 md:p-12 mx-auto max-w-7xl">
        <header className="gap-4 flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic">
                {editingId ? "Product Update" : "Inventory Editor"}
            </h1>
            <p className="text-slate-500 text-xs md:text-sm font-medium uppercase tracking-widest"><span className='text-blue-500 font-bold'>A.B.S.T Global</span> Mobile Store</p>
          </div>
         
            <div className='w-full flex gap-3 flex-col md:flex-row w-full md:w-auto'>

                <div>
                    <Link href='/admin' className="bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-100 flex justify-center items-center gap-2 hover:bg-gray-50 transition-all">
                        <FiUser size={18} className="text-[#0B2A4A]" />
                        <span className="text-[9px] font-black text-[#0B2A4A] uppercase tracking-widest">Dashboard</span>
                    </Link>
                </div>

                <div className='gap-3 flex justify-between md:justify-center items-center'>
                    <button form="product-form" disabled={loading} className={`w-full flex justify-center items-center gap-1 ${editingId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-[9px] text-white tracking-widest font-black px-4 py-4 rounded-xl shadow-lg transition-all disabled:opacity-50`}>
                        {loading ? <Upload className="animate-spin" /> : <Save size={20} />}
                        {loading ? "Publishing..." : editingId ? "Update Product" : "Save Product"}
                    </button>

                    {/* CANCEL UPDATE BUTTON */}
                    {editingId && (
                        <button 
                            onClick={handleCancelUpdate}
                            className="w-full flex justify-center items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-600 text-[9px] tracking-widest font-black px-4 py-4 rounded-xl shadow-sm transition-all"
                        >
                            <MdBlock size={18} />
                            CANCEL update
                        </button>
                    )}
                </div>

            </div>

        </header>

        <form id="product-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white py-5 px-3 md:p-4 rounded md:rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tighter italic border-l-4 border-purple-600 pl-3">
                 Select Category
              </h2>
              <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-md md:rounded-lg font-bold text-slate-700 outline-none focus:border-purple-500 transition-all" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                <option value="phone">Smartphone</option>
                <option value="accessory">Accessories</option>
                <option value="laptop">Laptop</option>
                <option value="smartwatch">Smart Watch</option>
                <option value="bluetooth">Bluetooth</option>
                <option value="others">Others</option>
              </select>
            </div>

            <div className="bg-white py-5 px-3 md:p-4 rounded md:rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tighter italic border-l-4 border-blue-600 pl-3">
                 Basic Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Product Name *</label>
                  <input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-md md:rounded-lg outline-none focus:border-blue-500 transition-all font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. iPhone 15 Pro Max" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Model ID</label>
                  <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-md md:rounded-lg outline-none focus:border-blue-500 transition-all font-bold" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} placeholder="e.g. A3094" />
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Description</label>
                <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-md md:rounded-lg outline-none focus:border-blue-500 transition-all h-32 font-medium" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the item features..." />
              </div>
            </div>

            <div className="bg-white py-5 px-3 md:p-4 rounded md:rounded-lg shadow-sm border border-slate-200">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter italic border-l-4 border-emerald-600 pl-3">
                  Product Variations
                </h2>
                <button type="button" onClick={handleAddVariant} className="flex items-center gap-1 text-blue-600 font-black md:font-bold text-xs uppercase hover:underline">
                  <Plus size={16}/> Add New Variant
                </button>
              </div>

              <div className="space-y-8">
                {variants.map((v) => (
                  <div key={v.id} className="my-4 p-4 rounded-md md:rounded-lg md:bg-slate-50 border border-slate-200 flex flex-col gap-6 relative group transition-all">
                    <button type="button" onClick={() => removeVariant(v.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full shadow-lg z-10 md:opacity-0 md:group-hover:opacity-100 transition-all">
                      <Delete size={14} />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><Gallery size={12}/> Images *</label>
                                <button type="button" onClick={() => handleAddImageToVariant(v.id)} className="text-[9px] bg-blue-600 text-white px-2 py-1 rounded font-bold uppercase">Add Image</button>
                            </div>
                            
                            <div className="py-2 space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {(v.images || []).map((img) => (
                                    <div key={img.id} className="bg-white p-2 rounded-lg border border-slate-200 relative">
                                        <button type="button" onClick={() => handleRemoveImageFromVariant(v.id, img.id)} className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full z-10"><X size={10}/></button>
                                        <div className="w-full h-32 bg-slate-50 rounded mb-2 overflow-hidden flex items-center justify-center">
                                            {img.url ? <img src={img.url} className="w-full h-full object-contain" alt="" /> : <Upload className="text-slate-300" size={20}/>}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="flex items-center justify-center gap-2 bg-slate-100 rounded p-2 text-[8px] font-black uppercase text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors">
                                                <Upload size={10} /> Local File
                                                <input type="file" hidden accept="image/*" onChange={(e) => handleVariantFileChange(v.id, img.id, e)} />
                                            </label>
                                            <div className="relative">
                                                <LinkIcon size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input className="w-full p-1.5 pl-6 bg-slate-50 border border-slate-100 rounded outline-none text-[8px] font-medium" value={img.file ? "File selected..." : img.url} onChange={e => handleVariantUrlChange(v.id, img.id, e.target.value)} placeholder="Image URL..." disabled={!!img.file} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Color Name</label>
                                <input className="w-full p-3 bg-white border border-slate-200 rounded-md outline-none text-sm font-bold" value={v.colorName} onChange={e => updateVariant(v.id, 'colorName', e.target.value)} placeholder="e.g. Black" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Hex Code</label>
                                <div className="flex gap-2">
                                    <input type="color" className="flex-1 w-full h-11 p-1 bg-white border border-slate-200 rounded-md cursor-pointer" value={v.colorCode} onChange={e => updateVariant(v.id, 'colorCode', e.target.value)} />
                                    <input className="flex-2 w-full p-3 bg-white border border-slate-200 rounded-md text-sm font-mono uppercase font-bold" value={v.colorCode} onChange={e => updateVariant(v.id, 'colorCode', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">RAM</label>
                                <input className="w-full p-3 bg-white border border-slate-200 rounded-md outline-none text-sm font-bold" value={v.ram} onChange={e => updateVariant(v.id, 'ram', e.target.value)} placeholder="e.g. 12GB" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">ROM / Storage</label>
                                <input className="w-full p-3 bg-white border border-slate-200 rounded-md outline-none text-sm font-bold" value={v.rom} onChange={e => updateVariant(v.id, 'rom', e.target.value)} placeholder="e.g. 512GB" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Battery</label>
                                <input className="w-full p-3 bg-white border border-slate-200 rounded-md outline-none text-sm font-bold" value={v.battery} onChange={e => updateVariant(v.id, 'battery', e.target.value)} placeholder="e.g. 5000mAh" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Camera</label>
                                <input className="w-full p-3 bg-white border border-slate-200 rounded-md outline-none text-sm font-bold" value={v.camera} onChange={e => updateVariant(v.id, 'camera', e.target.value)} placeholder="e.g. 108MP" />
                            </div>
                            
                            <div className="space-y-1 pt-4 border-t border-slate-100">
                                <label className="text-[10px] font-black uppercase text-blue-500 tracking-widest flex items-center gap-1">
                                    {formData.isPromo ? "PROMO PRICE (₦) *" : "SELLING PRICE (₦) *"}
                                </label>
                                <input 
                                    type="number" 
                                    className={`w-full p-3 rounded-md outline-none text-lg font-black transition-all ${formData.isPromo ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-white text-blue-600 border border-blue-200'}`} 
                                    value={v.price} 
                                    onChange={e => updateVariant(v.id, 'price', e.target.value)} 
                                    placeholder="1,000,000" 
                                />
                            </div>

                            {/* GLOBAL OLD PRICE DISPLAY BOX */}
                            <div className="space-y-1 pt-4 border-t border-slate-100">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                                    <Tag size={12}/> Old Price
                                </label>
                                <div className="w-full p-3 bg-slate-100 border border-slate-200 rounded-md text-sm font-bold text-slate-400 italic line-through cursor-not-allowed select-none">
                                    {formData.promoOldPrice ? `₦${Number(formData.promoOldPrice).toLocaleString()}` : "Not Set"}
                                </div>
                                <p className="text-[7px] text-slate-400 font-bold uppercase italic">Controlled via Sidebar</p>
                            </div>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white py-5 px-3 md:p-4 rounded md:rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-tighter italic border-l-4 border-amber-500 pl-3">Visibility</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-blue-600">Hero Product</span>
                  <input type="checkbox" className="w-5 h-5 accent-blue-600" checked={formData.isHero} onChange={e => setFormData({...formData, isHero: e.target.checked})} />
                </label>
                
                <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-emerald-600">Promo Offer</span>
                    </div>
                    <input type="checkbox" className="w-5 h-5 accent-emerald-600" checked={formData.isPromo} onChange={e => setFormData({...formData, isPromo: e.target.checked})} />
                    </label>

                    {formData.isPromo && (
                        <div className="pt-2 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-[9px] font-black uppercase text-amber-600 mb-1 flex items-center gap-1">
                                <Tag size={12}/> Original Price (₦)
                            </label>
                            <input 
                                type="number" 
                                className="w-full p-3 bg-amber-50 border-2 border-amber-200 rounded-md md:rounded-lg text-sm font-black text-slate-500 placeholder:text-slate-300 outline-none focus:border-amber-400 transition-all"
                                value={formData.promoOldPrice}
                                onChange={e => setFormData({...formData, promoOldPrice: e.target.value})}
                                placeholder="Enter Original Price..."
                            />
                        </div>
                    )}
                </div>

                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-amber-600">Mark as Latest</span>
                  <input type="checkbox" className="w-5 h-5 accent-amber-600" checked={formData.isLatest} onChange={e => setFormData({...formData, isLatest: e.target.checked})} />
                </label>
              </div>
            </div>
          </div>
        </form>

        <div className="mt-12 space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Current Inventory</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                    <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-500 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-lg flex-shrink-0 border overflow-hidden">
                                <img src={p.variants?.[0]?.images?.[0]?.url || p.variants?.[0]?.imageUrl} className="w-full h-full object-contain" alt="" />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-black text-slate-900 uppercase">{p.name}</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{p.category} • {p.variants?.length || 0} Variants</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => prepareEdit(p)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                                <Edit size={16} />
                            </button>
                            <button onClick={() => setShowDeleteConfirm(p.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                                <Delete size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}