'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { getBackPath } from '@/lib/navigation/getBackPath';

export default function BackButton({ fallback }: { fallback: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const from = searchParams.get('from');

  const handleBack = () => {
    const path = getBackPath({
      from,
      fallback,
    });

    router.push(path);
  };

  return (
    <button
      onClick={handleBack}
      className="fixed top-6 left-6 z-50 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md shadow"
    >
      ← 返回
    </button>
  );
}
