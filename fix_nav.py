import os

filepath = r'd:\\pia-ecom\\frontend\\src\\components\\layout\\Navbar.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = lines[:812]
bottom = """                      {itemCount > 0 && (
                        <span className='absolute -right-1.5 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full border border-navy-900 bg-brand-600 px-0.5 text-[8px] font-bold leading-none text-white'>
                          {itemCount > 9 ? "9+" : itemCount}
                        </span>
                      )}
                    </span>
                  : <Icon
                      className={iconClass}
                      strokeWidth={isOn ? 2.5 : 2}
                      aria-hidden='true'
                    />
                  }
                  <span aria-hidden='true'>{label}</span>
                </Link>
              );
            },
          )}
        </div>
      </nav>
      )}

      {/* Checkout Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-navy-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm border border-gray-200 bg-white shadow-2xl">
            <div className="border-b border-gray-100 p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff8eb] text-[#c5a059]">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-medium text-navy-900">
                Leave Checkout?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Your progress will be saved, but you are almost done placing your order.
              </p>
            </div>
            <div className="flex flex-col gap-2 p-4">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="w-full bg-[#c5a059] py-3 text-[11px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#b8924d]"
              >
                Continue Checkout
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  router.back();
                }}
                className="w-full border border-gray-200 bg-white py-3 text-[11px] font-bold uppercase tracking-widest text-gray-600 transition-colors hover:border-gray-300 hover:text-navy-900"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
"""
with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
    f.write(bottom)
