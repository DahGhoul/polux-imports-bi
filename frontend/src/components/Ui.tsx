import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

export function Badge({children, tone='neutral'}:{children:ReactNode;tone?:string}){ return <span className={`badge badge-${tone}`}>{children}</span> }
export function StageBadge({stage}:{stage:string}){ return <Badge tone={stage==='BUYER'?'violet':stage==='LEAD'?'blue':stage==='PAYER'?'green':'neutral'}>{stage}</Badge> }
export function PriorityBadge({priority}:{priority:string}){ return <Badge tone={priority==='ALTA'?'red':priority==='MEDIA'?'amber':'neutral'}>{priority}</Badge> }
export function ScoreRing({value,label,size=78}:{value:number;label:string;size?:number}){
  const deg = Math.max(0,Math.min(100,value))*3.6;
  return <div className="score-ring" style={{width:size,height:size,background:`conic-gradient(var(--accent) ${deg}deg, var(--ring) ${deg}deg)`}}><div><strong>{value}</strong><span>{label}</span></div></div>
}
export function MetricCard({label,value,sub,trend,icon:Icon}:{label:string;value:string|number;sub?:string;trend?:number;icon?:any}){
  return <div className="metric-card"><div className="metric-head"><span>{label}</span>{Icon&&<Icon size={18}/>}</div><div className="metric-value">{value}</div><div className="metric-foot">{trend!==undefined && <span className={trend>0?'trend up':trend<0?'trend down':'trend'}>{trend>0?<ArrowUpRight size={14}/>:trend<0?<ArrowDownRight size={14}/>:<Minus size={14}/>} {Math.abs(trend)}%</span>}<span>{sub}</span></div></div>
}
export function KpiStatus({value,good,warning,inverse=false}:{value:number;good:number;warning:number;inverse?:boolean}){
  const tone = inverse ? value <= good ? 'green' : value <= warning ? 'amber' : 'red' : value >= good ? 'green' : value >= warning ? 'amber' : 'red';
  return <span className={`kpi-dot ${tone}`}></span>
}
export function Empty({text='Sin datos'}:{text?:string}){ return <div className="empty-state">{text}</div> }
