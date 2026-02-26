
// It located at the app/product/[id]/page.tsx file.
// You can hold ctrl and click the link in the return section to take you there from here.

import ProductDetailsPage from "@/app/product/[id]/page"

export default function ProductDetailsUi({ params }: { params: Promise<{ id: string }> }) {
    return <ProductDetailsPage params={params} />
}