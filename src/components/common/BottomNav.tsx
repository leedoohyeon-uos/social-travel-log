/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Sparkles, Map, Users, User } from 'lucide-react';
import { NavItemConfig } from '../../types';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, hasUnreadBubblePops, setIsSettingsOpen } = useApp();

  // PART 22-3 Extensible Array Declaration
  const navItems: (NavItemConfig & { renderIcon: (active: boolean) => React.ReactNode })[] = [
    {
      id: 'search',
      label: '탐색',
      path: '/search',
      icon: 'search',
      renderIcon: (active) => <Search className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />,
    },
    {
      id: 'bubble',
      label: 'Bubble Pop',
      path: '/bubble',
      icon: 'bubble',
      renderIcon: (active) => (
        <div className="relative">
          <Sparkles className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
          {hasUnreadBubblePops && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-pink-500 ring-2 ring-white dark:ring-zinc-900" />
          )}
        </div>
      ),
    },
    {
      id: 'map',
      label: '지도',
      path: '/map',
      icon: 'map',
      emphasize: true,
      renderIcon: () => <Map className="w-7 h-7 text-white" />,
    },
    {
      id: 'friend',
      label: '친구',
      path: '/friend',
      icon: 'friend',
      renderIcon: (active) => <Users className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />,
    },
    {
      id: 'profile',
      label: '프로필',
      path: '/profile',
      icon: 'profile',
      renderIcon: (active) => <User className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />,
    },
  ];

  const handleNavClick = (id: (typeof navItems)[0]['id']) => {
    setIsSettingsOpen(false);
    setActiveTab(id);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-[#0c0c0c]/95 backdrop-blur-md border-t border-zinc-200 dark:border-white/10 z-30 flex items-center justify-around px-2 max-w-lg mx-auto sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl shadow-xl">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;

        if (item.emphasize) {
          return (
            <div key={item.id} className="relative -top-3 flex flex-col items-center">
              <button
                onClick={() => handleNavClick(item.id)}
                className={`w-14 h-14 rounded-full bg-gradient-to-tr from-[#9A7B56] via-[#C4A484] to-[#E5C590] flex items-center justify-center shadow-lg shadow-[#C4A484]/30 active:scale-95 hover:scale-105 transition-all duration-200 ring-4 ring-white dark:ring-[#0c0c0c] ${
                  isActive ? 'ring-[#C4A484]/60 dark:ring-[#C4A484]/50' : ''
                }`}
                title={item.label}
              >
                {item.renderIcon(isActive)}
              </button>
              <span className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-zinc-900 dark:text-[#E5C590]' : 'text-zinc-500 dark:text-zinc-400'}`}>
                {item.label}
              </span>
            </div>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 active:scale-95 ${
              isActive
                ? 'text-zinc-900 dark:text-[#E5C590] font-bold'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {item.renderIcon(isActive)}
            <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
