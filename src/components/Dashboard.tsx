import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DATES, fetchAllData, fetchScanData, type ScanEntry } from '@/lib/data';
import { Fish, Clock, Zap, Activity, ChevronLeft, ChevronRight, Search, Coffee, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [activeMobileCard, setActiveMobileCard] = useState<string | null>(null);
  const [data, setData] = useState<ScanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 8; // Adjust to show how many per page

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (selectedDate === 'all') {
        const allData = await fetchAllData();
        setData(allData);
      } else {
        const singleDayData = await fetchScanData(selectedDate);
        setData(singleDayData);
      }
      setLoading(false);
      setCurrentPage(1); // Reset page on filter change
      setSearchQuery(''); // Reset search on filter change
    }
    loadData();
  }, [selectedDate]);

  // Aggregating data
  const { totalScans, topAnimal, peakHour, maxHourValue, scanRateStr, speciesData, hourlyData, deadTimeStr, deadTimeWindow } = useMemo(() => {
    if (!data.length) return { totalScans: 0, topAnimal: '-', peakHour: '-', maxHourValue: 0, scanRateStr: '0m 0s', speciesData: [], hourlyData: [], deadTimeStr: '0m 0s', deadTimeWindow: '-' };

    const totalScans = data.length;

    // Species distribution
    const speciesCount: Record<string, number> = {};
    const hourlyCount: Record<string, number> = {};

    data.forEach(entry => {
      // species
      speciesCount[entry.type] = (speciesCount[entry.type] || 0) + 1;
      
      // hours
      const hour = entry.time.substring(0, 2) + ':00';
      hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
    });

    const speciesData = Object.entries(speciesCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const topAnimal = speciesData[0]?.name || '-';

    const hourlyData = Object.entries(hourlyCount)
      .map(([time, value]) => ({ time, value }))
      .sort((a, b) => a.time.localeCompare(b.time));

    let maxHourValue = 0;
    let peakHour = '-';
    hourlyData.forEach(h => {
      if (h.value > maxHourValue) {
        maxHourValue = h.value;
        peakHour = h.time;
      }
    });

    // scanRateStr & deadTime calculation
    const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);
    let totalDiffSecs = 0;
    let diffCount = 0;
    
    let maxGapSecs = 0;
    let deadTimeWindow = '-';
    
    for (let i = 1; i < sorted.length; i++) {
        // Only valid if on the same day
        if (sorted[i].date === sorted[i - 1].date) {
            const gap = (sorted[i].timestamp - sorted[i - 1].timestamp) / 1000;
            totalDiffSecs += gap;
            diffCount++;
            
            if (gap > maxGapSecs) {
                maxGapSecs = gap;
                deadTimeWindow = `${sorted[i - 1].time} a ${sorted[i].time}`;
            }
        }
    }
    
    let scanRateStr = '0m 0s';
    if (diffCount > 0) {
        const avgSecs = Math.round(totalDiffSecs / diffCount);
        const mins = Math.floor(avgSecs / 60);
        const secs = Math.floor(avgSecs % 60);
        scanRateStr = `${mins}m ${secs}s`;
    }

    let deadTimeStr = '0m 0s';
    if (maxGapSecs > 0) {
        const h = Math.floor(maxGapSecs / 3600);
        const m = Math.floor((maxGapSecs % 3600) / 60);
        if (h > 0) {
            deadTimeStr = `${h}h ${m}m`;
        } else {
            deadTimeStr = `${m}m`;
        }
    } else if (data.length <= 1) {
        deadTimeStr = '-';
    }

    return { totalScans, topAnimal, peakHour, maxHourValue, scanRateStr, speciesData, hourlyData, deadTimeStr, deadTimeWindow };
  }, [data]);

  // Table Search Filter
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter(entry => 
      entry.type.toLowerCase().includes(lowerQuery) || 
      entry.time.includes(lowerQuery) ||
      entry.date.includes(lowerQuery)
    );
  }, [data, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen print:min-h-0 bg-white font-sans text-slate-900 animate-in fade-in duration-500">
      
      {/* Semantic Brand Header */}
      <header className="w-full relative">
        <div className="w-full flex items-center justify-between py-4 px-4 sm:px-8 lg:px-12">
          <div style={{ fontFamily: '"Urbanist", sans-serif' }} className="text-xl tracking-tight select-none text-slate-900 shrink-0">
            <span className="font-semibold">Galo</span>
            <span className="font-light">Imagineering</span>
          </div>

          <div>
            <img src="/logos/image.png" alt="Logotipo" className="h-8 w-auto object-contain" />
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto pb-10 print:pb-0 space-y-10 px-4">
        <div className="flex flex-col items-center justify-center text-center space-y-6 md:space-y-4 relative">
          
        <div className="w-full md:w-auto flex justify-center md:absolute md:right-0 md:top-0 print:hidden mb-2 md:mb-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full sm:w-auto shadow-sm bg-slate-900 border border-slate-900 text-white hover:bg-white hover:text-slate-900 hover:border-slate-900 animate-pro-vibrate hover:animate-none transition-colors duration-300" 
            onClick={() => window.print()}
          >
            <Download className="h-4 w-4 mr-2" /> PDF Ejecutivo
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1 print:hidden mt-2 md:mt-0">Panel Analítico</h1>
          <p className="text-slate-500 font-medium tracking-tight print:text-2xl print:font-bold print:text-slate-900 print:mb-1">
            Métricas de interacción del Acuario Mágico
          </p>
          <p className="hidden print:block text-slate-700 font-semibold mt-2 text-sm text-center">
            Reporte de: {selectedDate === 'all' ? 'Todos los días (Histórico General)' : selectedDate}
          </p>
        </div>

        <div className="flex items-center gap-3 border border-slate-200 rounded-full pl-5 pr-2 py-1 shadow-sm mt-4 print:hidden">
          <span className="text-sm font-semibold text-slate-500">Filtrar por fecha:</span>
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-[200px] border-none shadow-none focus:ring-0 font-semibold h-auto py-1.5 text-slate-800">
              <SelectValue placeholder="Selecciona una fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los días</SelectItem>
              {DATES.map(date => (
                <SelectItem key={date} value={date}>{date}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20 animate-pulse text-slate-400">
          Cargando datos del panel...
        </div>
      ) : (
        <div className="space-y-8 px-4 w-full">
          
          <div className="w-full text-left pb-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Métricas Principales</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Resumen ejecutivo de volumen e interacción general</p>
          </div>

          {/* KPI Cards */}
          <TooltipProvider delayDuration={200}>
            <div className="grid grid-cols-1 md:grid-cols-5 print:grid-cols-2 gap-4">
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card 
                    className="relative rounded-none shadow-none border-slate-200 cursor-pointer md:cursor-help transition-colors hover:bg-slate-50/50 overflow-hidden"
                    onClick={() => setActiveMobileCard(activeMobileCard === 'criaturas' ? null : 'criaturas')}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-semibold text-slate-800">Criaturas del Acuario</CardTitle>
                        <Fish className="h-4 w-4 text-slate-500 stroke-[1.5]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold">{totalScans}</div>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Suma filtrada (sin espacio)</p>
                    </CardContent>
                    
                    {activeMobileCard === 'criaturas' && (
                      <div className="absolute inset-0 bg-slate-900/95 text-white p-4 flex items-center justify-center text-center text-xs font-medium z-10 md:hidden animate-in fade-in duration-200">
                        Muestra el número total absoluto acumulado de dibujos que los usuarios han escaneado en el periodo filtrado actualmente.
                      </div>
                    )}
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] text-center shadow-none border-slate-200">
                  <p className="text-sm">Muestra el número total absoluto acumulado de dibujos que los usuarios han escaneado en el periodo filtrado actualmente.</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card 
                    className="relative rounded-none shadow-none border-slate-200 cursor-pointer md:cursor-help transition-colors hover:bg-slate-50/50 overflow-hidden"
                    onClick={() => setActiveMobileCard(activeMobileCard === 'hora' ? null : 'hora')}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-semibold text-slate-800">Hora Pico</CardTitle>
                        <Clock className="h-4 w-4 text-slate-500 stroke-[1.5]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold">{peakHour}</div>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Con el tope de {maxHourValue} criaturas registradas</p>
                    </CardContent>
                    
                    {activeMobileCard === 'hora' && (
                      <div className="absolute inset-0 bg-slate-900/95 text-white p-4 flex items-center justify-center text-center text-xs font-medium z-10 md:hidden animate-in fade-in duration-200">
                        Identifica la hora específica del día donde se aglomeró la mayor afluencia ininterrumpida de usuarios escaneando.
                      </div>
                    )}
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] text-center shadow-none border-slate-200">
                  <p className="text-sm">Identifica la hora específica del día donde se aglomeró la mayor afluencia ininterrumpida de usuarios escaneando.</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card 
                    className="relative rounded-none shadow-none border-slate-200 cursor-pointer md:cursor-help transition-colors hover:bg-slate-50/50 overflow-hidden"
                    onClick={() => setActiveMobileCard(activeMobileCard === 'ritmo' ? null : 'ritmo')}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-semibold text-slate-800">Ritmo de Escaneo</CardTitle>
                        <Zap className="h-4 w-4 text-slate-500 stroke-[1.5]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold">{scanRateStr}</div>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Promedio entre dibujos</p>
                    </CardContent>
                    
                    {activeMobileCard === 'ritmo' && (
                      <div className="absolute inset-0 bg-slate-900/95 text-white p-4 flex items-center justify-center text-center text-xs font-medium z-10 md:hidden animate-in fade-in duration-200">
                        Tiempo promedio que pasa entre un escaneo y el siguiente.
                      </div>
                    )}
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] text-center shadow-none border-slate-200">
                  <p className="text-sm">Tiempo promedio que pasa entre un escaneo y el siguiente.</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card 
                    className="relative rounded-none shadow-none border-slate-200 cursor-pointer md:cursor-help transition-colors hover:bg-slate-50/50 overflow-hidden"
                    onClick={() => setActiveMobileCard(activeMobileCard === 'especie' ? null : 'especie')}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-semibold text-slate-800">Especie Dominante</CardTitle>
                        <Activity className="h-4 w-4 text-slate-500 stroke-[1.5]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold capitalize">{topAnimal}</div>
                        <p className="text-xs text-slate-500 mt-1 font-medium">El más coloreado del evento</p>
                    </CardContent>
                    
                    {activeMobileCard === 'especie' && (
                      <div className="absolute inset-0 bg-slate-900/95 text-white p-4 flex items-center justify-center text-center text-xs font-medium z-10 md:hidden animate-in fade-in duration-200">
                        Destaca el personaje visual que lidera estadísticamente las preferencias psicológicas de diseño elegidas por los niños asistentes.
                      </div>
                    )}
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] text-center shadow-none border-slate-200">
                  <p className="text-sm">Destaca el personaje visual que lidera estadísticamente las preferencias psicológicas de diseño elegidas por los niños asistentes.</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card 
                    className="relative rounded-none shadow-none border-slate-200 cursor-pointer md:cursor-help transition-colors hover:bg-slate-50/50 overflow-hidden"
                    onClick={() => setActiveMobileCard(activeMobileCard === 'inactividad' ? null : 'inactividad')}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-semibold text-slate-800">Mayor Inactividad</CardTitle>
                        <Coffee className="h-4 w-4 text-slate-500 stroke-[1.5]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold">{deadTimeStr}</div>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Lapso: {deadTimeWindow}</p>
                    </CardContent>
                    
                    {activeMobileCard === 'inactividad' && (
                      <div className="absolute inset-0 bg-slate-900/95 text-white p-4 flex items-center justify-center text-center text-xs font-medium z-10 md:hidden animate-in fade-in duration-200">
                        Rastrea la franja horaria ininterrumpida más prolongada donde el sistema operativo no recibió ningún escaneo (Tiempo muerto).
                      </div>
                    )}
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] text-center shadow-none border-slate-200">
                  <p className="text-sm">Rastrea la franja horaria ininterrumpida más prolongada donde el sistema operativo no recibió ningún escaneo (Tiempo muerto).</p>
                </TooltipContent>
              </Tooltip>

            </div>
          </TooltipProvider>

          <div className="w-full text-left pt-6 pb-2 print:break-before-page">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Desglose Analítico</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Visualización del comportamiento según especie y línea temporal</p>
          </div>

          {/* Charts (Refined plain styling) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="rounded-none shadow-none border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Rendimiento por Especies</CardTitle>
                <CardDescription>Cantidad de dibujos agrupados por especie de animal marino</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={speciesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#64748b' }} 
                      tickMargin={10} 
                      className="capitalize"
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#64748b' }}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: '#f1f5f9' }} 
                      contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: 'none' }}
                      formatter={(value: any) => [value, 'Escaneos']}
                      labelFormatter={(label: any) => String(label).charAt(0).toUpperCase() + String(label).slice(1)}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#0f172a" 
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-none shadow-none border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Actividad por Hora del Día</CardTitle>
                <CardDescription>Volumen de dibujos procesados a lo largo del día</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={hourlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false}/>
                    <XAxis 
                      dataKey="time" 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#64748b' }} 
                      tickMargin={10}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#64748b' }}
                    />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: 'none' }}
                      formatter={(value: any) => [value, 'Dibujos']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#0f172a" 
                      strokeWidth={2}
                      fillOpacity={0.1} 
                      fill="#0f172a" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="w-full text-left pt-6 pb-2 print:hidden">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Historial de Registros</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Base de datos estructurada con todos los escaneos documentados en el sistema</p>
          </div>

          {/* Table with Search */}
          <Card className="rounded-none shadow-none border-slate-200 mt-4 print:hidden">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Registro Detallado</CardTitle>
                <CardDescription>Visualización secuencial de todos los escaneos documentados</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input 
                  type="text"
                  placeholder="Buscar especie, hora..." 
                  className="pl-9 bg-slate-50 shadow-none border-slate-200 focus-visible:ring-0 focus-visible:border-slate-400"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset to page 1 on search
                  }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="border border-slate-200 rounded-sm">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-slate-800 rounded-tl-sm w-[30%]">Fecha</TableHead>
                      <TableHead className="font-semibold text-slate-800 w-[30%]">Hora</TableHead>
                      <TableHead className="font-semibold text-slate-800 rounded-tr-sm">Especie</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((entry, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-slate-600">{entry.date}</TableCell>
                          <TableCell className="text-slate-600 font-mono text-sm">{entry.time}</TableCell>
                          <TableCell className="capitalize font-medium">{entry.type}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-slate-500">
                          No se encontraron registros con esa búsqueda.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination controls */}
              {totalPages > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4">
                  <div className="text-sm text-slate-500 font-medium">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length} registros
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="shadow-none border-slate-200"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1 stroke-[1.5]" /> Anterior
                    </Button>
                    <div className="text-sm font-medium text-slate-700">
                      Página {currentPage} / {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shadow-none border-slate-200"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente <ChevronRight className="h-4 w-4 ml-1 stroke-[1.5]" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      </main>
    </div>
  );
}
