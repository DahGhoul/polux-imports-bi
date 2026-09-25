import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

export function Badge({children, tone='neutral'}:{children:ReactNode;tone?:string}){ return <span className={`badge badge-${tone}`}>{children}</span> }
export function StageBadge({stage}:{stage:string}){ return <Badge tone={stage==='BUYER'?'violet':stage==='LEAD'?'blue':stage==='PAYER'?'green':'neutral'}>{stage}</Badge> }
export function PriorityBadge({priority}:{priority:string}){ return <Badge tone={priority==='ALTA'?'red':priority==='MEDIA'?'amber':'neutral'}>{priority}</Badge> }
export function ScoreRing({ value, label, size = 78, tone }: { value: number; label: string; size?: number; tone?: string }) {
  const safeVal = Math.max(0, Math.min(100, Math.round(value || 0)));
  const strokeColor = tone === 'emerald' ? '#10b981' 
                    : tone === 'purple' ? '#a855f7' 
                    : tone === 'amber' ? '#f59e0b' 
                    : tone === 'cyan' ? '#06b6d4'
                    : safeVal >= 75 ? '#10b981' 
                    : safeVal >= 50 ? '#3b82f6' 
                    : '#f59e0b';
  const radius = Math.max(10, (size - 10) / 2);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeVal / 100) * circumference;

  return (
    <div className="score-ring-wrapper" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="score-ring-content">
        <strong style={{ color: strokeColor }}>{safeVal}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
export function MetricCard({label,value,sub,trend,icon:Icon}:{label:string;value:string|number;sub?:string;trend?:number;icon?:any}){
  return <div className="metric-card"><div className="metric-head"><span>{label}</span>{Icon&&<Icon size={18}/>}</div><div className="metric-value">{value}</div><div className="metric-foot">{trend!==undefined && <span className={trend>0?'trend up':trend<0?'trend down':'trend'}>{trend>0?<ArrowUpRight size={14}/>:trend<0?<ArrowDownRight size={14}/>:<Minus size={14}/>} {Math.abs(trend)}%</span>}<span>{sub}</span></div></div>
}
export function KpiStatus({value,good,warning,inverse=false}:{value:number;good:number;warning:number;inverse?:boolean}){
  const tone = inverse ? value <= good ? 'green' : value <= warning ? 'amber' : 'red' : value >= good ? 'green' : value >= warning ? 'amber' : 'red';
  return <span className={`kpi-dot ${tone}`}></span>
}
export function Empty({text='Sin datos'}:{text?:string}){ return <div className="empty-state">{text}</div> }
