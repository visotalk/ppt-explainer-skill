import React from 'react';
import {useProp} from '@visotalk/runtime';

const ink='#edf4f8', blue='#85cbd0', red='#ed876d', muted='#9ab0c4';
export function Background() {
  return <div style={{width:'100%',height:'100%',background:'radial-gradient(ellipse at 50% 40%, #17334d, #0b1c30)',border:'2px solid #34506a',boxSizing:'border-box'}}/>;
}
export function Title({text}: {text:string}) {
  return <div style={{fontSize:66,fontWeight:700,color:ink,lineHeight:1.3}}>{text}</div>;
}
export function Intro() {
  const draw=useProp('draw',0);
  return <svg width="1680" height="550" viewBox="0 0 1680 550">
    <text x="0" y="240" fontSize="200" fill={ink} fontFamily="Georgia,serif">Hold?</text>
    <path d="M0 300 H780 L840 250" stroke={blue} fill="none" strokeWidth="4" pathLength="1" strokeDasharray="1" strokeDashoffset={1-draw}/>
    <text x="1000" y="190" fontSize="50" fill={muted}>乐观空间很大</text>
    <text x="1000" y="270" fontSize="50" fill={blue}>为什么仍然持有？</text>
  </svg>;
}
export function Chart({complete=false}: {complete?:boolean}) {
  const zoom=useProp('zoom',complete?1:0);
  const price=useProp('price',complete?1:0);
  const base=useProp('base',complete?1:0);
  const gap=useProp('gap',complete?1:0);
  const bear=useProp('bear',complete?1:0);
  const bull=useProp('bull',complete?1:0);
  const ratio=useProp('ratio',0);
  const note=useProp('note',complete?3:0);
  const low=70-30*zoom, high=90+50*zoom;
  const x=(n:number)=>100+(n-low)/(high-low)*1480;
  const at=75.79+5*base-(80.79-51.91)*bear+(124.74-51.91)*bull;
  const color=bull>0?muted:bear>0?red:blue;
  const mark=(value:number,label:string,alpha:number,paint:string,top=true)=><g opacity={alpha}>
    <line x1={x(value)} y1="300" x2={x(value)} y2={top?240:365} stroke={paint} strokeWidth="2"/>
    <circle cx={x(value)} cy="300" r="9" fill={paint}/>
    <text x={x(value)} y={top?180:420} textAnchor="middle" fontSize="52" fontWeight="700" fill={paint}>{value.toFixed(2)}</text>
    <text x={x(value)} y={top?223:465} textAnchor="middle" fontSize="30" fill={paint}>{label}</text>
  </g>;
  return <svg width="1680" height="620" viewBox="0 0 1680 620">
    <line x1="40" y1="300" x2="1640" y2="300" stroke="#48617b" strokeWidth="3"/>
    {[40,50,60,70,80,90,100,110,120,130,140].filter(v=>v>=low&&v<=high).map(v=><g key={v}><line x1={x(v)} y1="290" x2={x(v)} y2="310" stroke="#48617b"/><text x={x(v)} y="345" textAnchor="middle" fontSize="26" fill={muted}>{v}</text></g>)}
    <rect x={x(75.79)} y="260" width={Math.max(0,(x(80.79)-x(75.79))*gap)} height="40" fill={blue} opacity=".2"/>
    <line x1={x(75.79)} y1="300" x2={x(75.79)+(x(80.79)-x(75.79))*gap} y2="300" stroke={blue} strokeWidth="12"/>
    <line x1={x(75.79)} y1="300" x2={x(75.79)+(x(51.91)-x(75.79))*bear} y2="300" stroke={red} strokeWidth="8"/>
    <line x1={x(75.79)} y1="300" x2={x(75.79)+(x(124.74)-x(75.79))*bull} y2="300" stroke={muted} strokeWidth="4" strokeDasharray="12 9"/>
    {mark(75.79,'当时股价',price,ink,false)}
    {mark(80.79,'基准',base,blue)}
    {mark(51.91,'悲观',bear,red)}
    {mark(124.74,'乐观',bull,muted)}
    {!complete && <g opacity={price}><path d={`M${x(at)-15} 260 L${x(at)} 285 L${x(at)+15} 260Z`} fill={color}/><text x="1640" y="70" textAnchor="end" fontSize="38" fill={color}>{at.toFixed(2)}</text></g>}
    <g opacity={gap*(1-zoom)}><path d={`M${x(75.79)} 115 V90 H${x(80.79)} V115`} fill="none" stroke={blue} strokeWidth="2"/><text x={(x(75.79)+x(80.79))/2} y="65" textAnchor="middle" fontSize="42" fill={blue}>差额 +{(5*gap).toFixed(2)}</text></g>
    <text x="1640" y="575" textAnchor="end" fontSize={note?42:85} fill={ratio<0?red:blue}>{note===1?'情景 ≠ 发生概率':note===2?'同口径计算假设 · 币种待核实':note===3?'基准 +6.6% / 悲观 −31.5%':ratio?`${ratio>0?'+':''}${ratio.toFixed(1)}%`:''}</text>
  </svg>;
}
export function Factors({risk=false}: {risk?:boolean}) {
  const a=useProp('a',0),b=useProp('b',0),c=useProp('c',0);
  const labels=risk?['消费偏好变化','管理层反应偏慢','业务相对缺乏多样性']:['中国二孩政策','行业进入壁垒','乳品价格预计下降'];
  return <svg width="1680" height="570"><line x1="75" y1="80" x2="75" y2="480" stroke="#48617b" strokeWidth="3"/>{labels.map((label,i)=><g key={label} opacity={[a,b,c][i]}><circle cx="75" cy={100+i*160} r="12" fill={risk?red:blue}/><text x="145" y={120+i*160} fontSize="58" fill={ink}>{label}</text><text x="1400" y={120+i*160} fontSize="28" fill={muted}>{risk?'原稿风险':'原稿利好'}</text></g>)}</svg>;
}
