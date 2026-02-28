import AboutEditor from "@/components/admin/settings/AboutPageSettings";
import Link from "next/link";
import ContactEditor from "@/components/admin/settings/ContactSettings";
import FinanceEditor from "@/components/admin/settings/InstallmentalSetting";
import LegalEditor from "@/components/admin/settings/PolicyAndFaqSettings";
import { FiUser } from "react-icons/fi";

export default function AdminSettingsUi() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mx-auto max-w-7xl relative py-20 md:px-8">
            <div className="absolute top-8 right-4 md:right-11.5">
                <Link href='/admin' className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 hover:bg-gray-50 transition-all">
                    <FiUser size={18} className="text-[#0B2A4A]" />
                    <span className="text-[9px] font-black text-[#0B2A4A] uppercase tracking-widest">Dashboard</span>
                </Link>
            </div>

            <div className="w-full">
                <ContactEditor/>
            </div>

           <div className="w-full">
                <AboutEditor/>
           </div>
            
            <div className="w-full">
                <FinanceEditor/>
            </div>

            <div className="w-full">
                <LegalEditor/>
            </div>
        </div>
    )
}