'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { User } from '@/types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data);
        if (res.data.must_change_password) {
          router.push('/change-password');
        }
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    router.push('/login');
  };

  return { user, loading, logout };
};
