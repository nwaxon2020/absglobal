import FinancingAdminHub from "@/components/admin/salesAndOrder/FinancingAdminDropdown";
import { FiUser } from "react-icons/fi";
import Link from "next/link";

export default function SalesAndOrderUi() {
    return(
        <div className="min-h-screen px-4 md:px-12 bg-slate-50 font-sans">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center">
                    <div className="mb-4">
                        <h1 className="pt-10 text-3xl font-black uppercase italic text-[#0B2A4A] tracking-tighter">Sales & Financing</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Manage Customer Installments and Markup Rates</p>
                    </div>
                    <div>
                        <Link href='/admin' className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 hover:bg-gray-50 transition-all">
                            <FiUser size={18} className="text-[#0B2A4A]" />
                            <span className="text-[9px] font-black text-[#0B2A4A] uppercase tracking-widest">Dashboard</span>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* The Hub now behaves like a standard grid item */}
                    <FinancingAdminHub />

                    {/* Placeholder for your next component */}
                    <div className="w-full bg-white rounded-xl border-2 border-dashed border-slate-200 h-40 flex items-center justify-center">
                         <p className="text-[9px] font-black uppercase text-slate-300">Next Admin Card Here</p>
                    </div>
                </div>
            </div>
        </div>
    )
}