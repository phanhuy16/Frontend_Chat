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
        <div className="absolute bottom-20 right-0 z-50 w-[350px] bg-white dark:bg-slate-900 rounded-2xl shadow-premium border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col animate-slide-up">
            <div className="p-3 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div className="flex-1 relative mr-2">
                    <input 
                        type="text" 
                        placeholder="Search Giphy..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-white/5 rounded-full py-2 px-4 text-xs outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                    />
                </div>
                <button 
                    onClick={onClose}
                    className="size-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400"
                >
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>
            </div>
            <div className="h-[400px] overflow-y-auto p-2 scrollbar-hide">
                <Grid
                    key={searchTerm}
                    width={330}
                    columns={2}
                    fetchGifs={fetchGifs}
                    onGifClick={(gif, e) => {
                        e.preventDefault();
                        onGifSelect(gif);
                    }}
                    gutter={6}
                />
            </div>
            <div className="p-2 bg-slate-50 dark:bg-black/20 flex justify-center">
                <img src="https://raw.githubusercontent.com/Giphy/giphy-js/master/packages/react-components/static/PoweredBy_200px-White_Horizontal.png" alt="Powered by Giphy" className="h-4 opacity-50" />
            </div>
        </div>
    );
};

export default GiphyPicker;
