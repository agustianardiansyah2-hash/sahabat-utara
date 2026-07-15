function Card({ children, className = '', title, subtitle, icon: Icon, gradient = false }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      {(title || Icon) && (
        <div className={`px-5 py-4 ${gradient ? 'bg-gradient-to-r from-primary-600 to-accent-600' : 'border-b border-slate-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              {title && <h3 className={`font-semibold ${gradient ? 'text-white' : 'text-slate-800'}`}>{title}</h3>}
              {subtitle && <p className={`text-sm mt-0.5 ${gradient ? 'text-primary-100' : 'text-slate-500'}`}>{subtitle}</p>}
            </div>
            {Icon && (
              <div className={`p-2 rounded-lg ${gradient ? 'bg-white/20' : 'bg-primary-100'}`}>
                <Icon className={`w-5 h-5 ${gradient ? 'text-white' : 'text-primary-600'}`} />
              </div>
            )}
          </div>
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

export default Card;
