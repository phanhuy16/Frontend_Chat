import React from "react";
import { Poll } from "../../types";
import { pollApi } from "../../api/poll.api";

interface PollBucketProps {
  poll: Poll;
  currentUserId: number;
}

const PollBucket: React.FC<PollBucketProps> = ({ poll, currentUserId }) => {
  const handleVote = async (optionId: number) => {
    try {
      await pollApi.vote(poll.id, optionId);
    } catch (err) {
      console.error("Vote failed:", err);
    }
  };

  return (
    <div className="min-w-[280px] max-w-[320px] bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
        {poll.question}
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        {poll.allowMultipleVotes
          ? "Chọn nhiều phương án"
          : "Chọn một phương án"}{" "}
        • {poll.totalVotes} lượt bình chọn
      </p>

      <div className="space-y-2">
        {poll.options.map((option) => {
          const percent =
            poll.totalVotes > 0
              ? Math.round((option.voteCount / poll.totalVotes) * 100)
              : 0;

          const isVoted = option.votes.some((v) => v.userId === currentUserId);

          return (
            <div key={option.id} className="relative group">
              <button
                onClick={() => handleVote(option.id)}
                className={`w-full relative overflow-hidden rounded-xl border transition-all duration-300 ${
                  isVoted
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30"
                }`}
              >
                {/* Progress Bar Background */}
                <div
                  className={`absolute top-0 bottom-0 left-0 transition-all duration-700 ease-out ${
                    isVoted
                      ? "bg-primary/30"
                      : "bg-slate-200/50 dark:bg-slate-700/50"
                  }`}
                  style={{ width: `${percent}%` }}
                />

                <div className="relative p-3.5 flex items-center justify-between z-10">
                  <span
                    className={`text-sm font-semibold ${
                      isVoted
                        ? "text-primary"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {option.text}
                  </span>
                  <div className="flex items-center gap-2.5">
                    {isVoted && (
                      <span className="material-symbols-outlined text-primary text-[18px]">
                        check_circle
                      </span>
                    )}
                    <span className="text-xs font-black text-slate-400">
                      {option.voteCount}
                    </span>
                  </div>
                </div>
              </button>

              {/* Avatars of voters (optional, show first few) */}
              {option.votes.length > 0 && (
                <div className="flex -space-x-1 mt-1 ml-1">
                  {option.votes.slice(0, 5).map((v) => (
                    <div
                      key={v.userId}
                      className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 shadow-sm"
                      title={v.username}
                    >
                      {v.avatarUrl ? (
                        <img
                          src={v.avatarUrl}
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                          {v.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}
                  {option.votes.length > 5 && (
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] flex items-center justify-center font-bold text-slate-500 border-2 border-white dark:border-slate-800 shadow-sm">
                      +{option.votes.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Bởi {poll.creatorName}
        </span>
      </div>
    </div>
  );
};

export default PollBucket;
