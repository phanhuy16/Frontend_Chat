import React, { useState } from 'react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import { GIPHY_API_KEY } from '../../utils/constants';

const gf = new GiphyFetch(GIPHY_API_KEY);

interface GiphyPickerProps {
    onGifSelect: (gif: any) => void;
    onClose: () => void;
}

const GiphyPicker: React.FC<GiphyPickerProps> = ({ onGifSelect, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const fetchGifs = (offset: number) => {
        if (searchTerm) {
            return gf.search(searchTerm, { offset, limit: 10 });
        }
        return gf.trending({ offset, limit: 10 });
    };

    return (
      <div className="w-full h-full bg-transparent overflow-hidden flex flex-col">
        <div className="p-3 border-b border-slate-200/50 dark:border-white/5">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Giphy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-4 text-xs text-black dark:text-white outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2.5 scrollbar-hide">
          <Grid
            key={searchTerm}
            width={280}
            columns={2}
            fetchGifs={fetchGifs}
            onGifClick={(gif, e) => {
              e.preventDefault();
              onGifSelect(gif);
            }}
            gutter={6}
          />
        </div>
        <div className="p-2 border-t border-slate-200/50 dark:border-white/5 flex justify-center bg-slate-50/30 dark:bg-black/10">
          <img
            src="https://raw.githubusercontent.com/Giphy/giphy-js/master/packages/react-components/static/PoweredBy_200px-White_Horizontal.png"
            alt="Powered by Giphy"
            className="h-3 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300"
          />
        </div>
      </div>
    );
};

export default GiphyPicker;
