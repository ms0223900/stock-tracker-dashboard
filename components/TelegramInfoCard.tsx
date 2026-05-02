"use client";

export default function TelegramInfoCard() {
  return (
    <div className="bg-primary-container text-white rounded-xl p-lg flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-md">
        <span className="material-symbols-outlined text-3xl">send</span>
      </div>
      <h3 className="text-title-sm mb-xs">Telegram Alerts Active</h3>
      <p className="text-body-sm opacity-90 mb-md leading-relaxed">
        Connect @ZenTradeTW_Bot to receive instant market notifications on your
        mobile devices.
      </p>
      <button className="px-lg py-2 bg-white text-primary font-label-caps text-label-caps rounded-full hover:bg-surface-container transition-colors">
        VIEW SETTINGS
      </button>
    </div>
  );
}
