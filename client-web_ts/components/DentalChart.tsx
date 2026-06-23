import React, { useState } from 'react';
import { Tooth, ToothStatus } from '../types';

interface DentalChartProps {
  teeth: Tooth[] | undefined;
}

const statusConfig: Record<ToothStatus, { label: string; colors: string }> = {
  healthy: { label: 'Здоровий', colors: 'bg-white border-green-200 text-green-700 hover:bg-green-50' },
  caries: { label: 'Карієс', colors: 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100' },
  filling: { label: 'Пломба', colors: 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100' },
  extracted: { label: 'Видалений', colors: 'bg-gray-50 border-gray-200 text-gray-400 line-through opacity-70 hover:opacity-100' },
  crown: { label: 'Коронка', colors: 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100' },
  implant: { label: 'Імплант', colors: 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100' },
  other: { label: 'Інше', colors: 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100' },
};

export const DentalChart: React.FC<DentalChartProps> = ({ teeth = [] }) => {
  const [activeTooth, setActiveTooth] = useState<Tooth | null>(null);

  // FDI
  const UR = [18, 17, 16, 15, 14, 13, 12, 11];
  const UL = [21, 22, 23, 24, 25, 26, 27, 28];
  const LR = [48, 47, 46, 45, 44, 43, 42, 41];
  const LL = [31, 32, 33, 34, 35, 36, 37, 38];

  const getToothData = (num: number): Tooth => {
    return teeth.find(t => t.tooth_number === num) || {
      id: Math.random(),
      tooth_number: num,
      status: 'healthy'
    };
  };

  const renderQuadrant = (nums: number[]) => {
    return (
      <div className="grid grid-cols-8 gap-0.5 sm:gap-1.5 xl:gap-2 w-full">
        {nums.map(num => {
          const t = getToothData(num);
          const config = statusConfig[t.status];
          return (
            <button
              key={num}
              type="button"
              onMouseEnter={() => setActiveTooth(t)}
              onMouseLeave={() => setActiveTooth(null)}
              className={`w-full aspect-[2/3] sm:aspect-[3/4] md:aspect-[4/5] rounded-md sm:rounded-lg lg:rounded-xl flex items-center justify-center text-[10px] sm:text-xs md:text-sm lg:text-base font-extrabold border sm:border-2 transition-all duration-300 transform hover:scale-110 shadow-sm ${config.colors} ${activeTooth?.tooth_number === num ? 'ring-2 sm:ring-4 ring-offset-1 sm:ring-offset-2 ring-dental-400 z-10 scale-110' : ''}`}
            >
              {num}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center relative w-full pt-4">

      {/* Header */}
      <div className="w-full flex flex-wrap justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        {(Object.entries(statusConfig) as [ToothStatus, { label: string; colors: string }][]).map(([status, config]) => (
          <div key={status} className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium text-gray-600">
            <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-md border sm:border-2 ${config.colors}`}></div>
            {config.label}
          </div>
        ))}
      </div>

      <div className="relative w-full max-w-5xl flex flex-col gap-4 sm:gap-6 mt-2 sm:mt-6 px-4 md:px-8 lg:px-12">

        <span className="absolute left-0 lg:left-2 top-1/2 -translate-y-1/2 -rotate-90 hidden md:block uppercase text-xs lg:text-sm tracking-[0.3em] font-extrabold text-gray-300">Права</span>
        <span className="absolute right-0 lg:right-2 top-1/2 -translate-y-1/2 rotate-90 hidden md:block uppercase text-xs lg:text-sm tracking-[0.3em] font-extrabold text-gray-300">Ліва</span>

        {/* Верх у FDI */}
        <div className="flex flex-row w-full justify-center border-b-2 border-dashed border-gray-200 pb-4 sm:pb-8 relative pt-6 md:pt-0">

          <span className="absolute top-0 left-2 block md:hidden text-[10px] uppercase tracking-wider font-semibold text-gray-300"> Права </span>
          <span className="absolute top-0 right-2 block md:hidden text-[10px] uppercase tracking-wider font-semibold text-gray-300"> Ліва </span>

          <div className="w-1/2 pr-1 sm:pr-3 xl:pr-4">
            {renderQuadrant(UR)}
          </div>
          <div className="w-1/2 pl-1 sm:pl-3 xl:pr-4 border-l-2 border-dashed border-gray-200">
            {renderQuadrant(UL)}
          </div>
        </div>

        {/* Низ у FDI */}
        <div className="flex flex-row w-full justify-center relative pt-2 sm:pt-4 pb-6 md:pb-0">

          <span className="absolute bottom-0 left-2 block md:hidden text-[10px] uppercase tracking-wider font-semibold text-gray-300"> Права </span>
          <span className="absolute bottom-0 right-2 block md:hidden text-[10px] uppercase tracking-wider font-semibold text-gray-300"> Ліва </span>

          <div className="w-1/2 pr-1 sm:pr-3 xl:pr-4 mb-4 md:mb-0">
            {renderQuadrant(LR)}
          </div>
          <div className="w-1/2 pl-1 sm:pl-3 xl:pr-4 border-l-2 border-dashed border-gray-200">
            {renderQuadrant(LL)}
          </div>
        </div>

      </div>

      <div className={`mt-8 sm:mt-10 mx-auto w-full max-w-lg transition-all duration-300 ${activeTooth ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}>
        <div className="bg-white border border-dental-100 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center text-center gap-4">
          {activeTooth ? (
            <div className="flex flex-col items-center justify-center w-full">
              <h4 className="font-extrabold text-xl sm:text-2xl text-gray-900 flex items-center gap-2 sm:gap-3 mb-2">
                <span className="text-dental-500">Зуб {activeTooth?.tooth_number}</span>
                <span className={`px-2 py-1 sm:px-3 sm:py-1 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider ${statusConfig[activeTooth.status].colors} shadow-sm border`}>
                  {statusConfig[activeTooth.status].label}
                </span>
              </h4>
              {activeTooth?.notes ? (
                <p className="text-sm sm:text-base text-gray-700 bg-gray-50 px-4 sm:px-6 py-2 sm:py-3 rounded-xl border border-gray-100 font-medium">{activeTooth.notes}</p>
              ) : (
                <p className="text-xs sm:text-sm text-gray-400 italic">Немає закріплених нотаток чи процедур.</p>
              )}
            </div>
          ) : null}
        </div>
      </div>

    </div>
  );
};