import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { userApi } from "../api/user.api";
import { friendApi } from "../api/friend.api";
import { User } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "react-i18next";

const SearchUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState<{ [key: number]: boolean }>({});

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const data = await userApi.searchUsers(searchTerm);
      // Filter out current user from results
      setResults(data.filter((u) => u.id !== currentUser?.id));
    } catch (err) {
      toast.error(t("toast.search_error"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId: number) => {
    try {
      setRequesting((prev) => ({ ...prev, [userId]: true }));
      await friendApi.sendFriendRequest(userId);
      toast.success(t("toast.friend_request_sent"));
    } catch (err) {
      toast.error(t("toast.friend_request_error"));
    } finally {
      setRequesting((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full glass-effect lg:rounded-3xl overflow-hidden animate-fade-in">
      {/* Header Area */}
      <div className="p-8 pb-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t("search_users.title")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {t("search_users.subtitle")}
            </p>
          </div>
          <button
            onClick={() => navigate("/chat")}
            className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Premium Search Bar */}
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
          <div className="relative flex items-center bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl px-4 py-3 transition-all focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-primary/50">
            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 mr-3 text-xl">
              search
            </span>
            <input
              type="text"
              placeholder={t("search_users.placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-semibold"
            />
            {loading && (
              <div className="w-6 h-6 border-3 border-primary/20 border-t-primary rounded-full animate-spin ml-4"></div>
            )}
          </div>
        </form>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8 mt-4">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 grayscale opacity-40">
            <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-6xl">
                person_search
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
              {searchTerm
                ? t("search_users.no_results_title")
                : t("search_users.start_search_title")}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm font-bold text-sm uppercase tracking-widest leading-relaxed">
              {searchTerm
                ? t("search_users.no_results_desc", { term: searchTerm })
                : t("search_users.start_search_desc")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((u) => (
              <div
                key={u.id}
                className="group p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/40 rounded-[2rem] hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 relative overflow-hidden"
              >
                <div className="flex flex-col items-center text-center gap-5 relative z-10">
                  {/* Avatar section */}
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-tr from-primary to-secondary rounded-full opacity-0 group-hover:opacity-20 blur-md transition duration-500"></div>
                    {u.avatar ? (
                      <div
                        className="relative w-24 h-24 rounded-full bg-cover bg-center border-4 border-white dark:border-slate-800 shadow-xl group-hover:scale-105 transition-transform duration-500"
                        style={{ backgroundImage: `url("${u.avatar}")` }}
                      />
                    ) : (
                      <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-black border-4 border-white dark:border-slate-800 shadow-xl group-hover:scale-105 transition-transform duration-500">
                        {u.displayName?.charAt(0).toUpperCase() ||
                          u.userName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info section */}
                  <div className="flex flex-col gap-1">
                    <h4 className="font-black text-slate-900 dark:text-white text-xl group-hover:text-primary transition-colors">
                      {u.displayName || u.userName}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-none">
                      @{u.userName}
                    </p>
                  </div>

                  {/* Actions section */}
                  <div className="w-full mt-2">
                    <button
                      onClick={() => handleSendRequest(u.id)}
                      disabled={requesting[u.id]}
                      className="w-full py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-black shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
                    >
                      {requesting[u.id] ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-lg">
                            person_add
                          </span>
                          {t("search_users.connect")}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Decorative background element */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchUsersPage;
