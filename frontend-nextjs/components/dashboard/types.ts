import { ReactNode } from 'react';

export interface MenuItem {
  name: string;
  path: string;
  icon: ReactNode;
  permission?: string | null;
}
