import { Suspense } from 'react';
import { StoreSkeleton } from '@/components/LoadingStates';
import StorePageUi from '@/ui/StorePageUi';

export default function Page() {
  return (
    <Suspense fallback={<StoreSkeleton />}>
      <StorePageUi />
    </Suspense>
  );
}