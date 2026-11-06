import {Doc, Scene, Line, Part, Animation, Appear, Tween, Set} from '@visotalk/jsx';
import {Background, Title, Intro, Chart, Factors} from './visuals';
export default <Doc id="mjn-standard" title="Hold 背后的距离" lang="zh-CN" voice="./voice.mjs:yunxi" theme="visotalk/dark" canvas="16x9" tokens={{colors:{bg:'#0b1c30',text:'#edf4f8',data:'#85cbd0'},fonts:{sans:'"Noto Sans SC", sans-serif'}}}>
  <Part id="ground" x={0} y={0} w={1920} h={1080} z={-1}><Background/></Part>
  <Part id="source" x={120} y={40} w={1680} h={45}><div style={{fontSize:26,color:'#9ab0c4'}}>MJN / 估值的距离 · 原稿第 1 页 · 历史案例</div></Part>
  <Part id="assumption" x={120} y={858} w={1680} h={38}><div style={{fontSize:26,color:"#9ab0c4"}}>暂按同币种口径计算 · 币种待核实 · 原稿未给出情景概率</div></Part>
  <Scene id="intro">
    <Line id="opening-1" hold={0.25}>这份报告有个值得琢磨的地方。</Line>
<Line id="opening-2" hold={0.25}>它给美赞臣的评级是持有，可乐观估值，比当时股价高了六成多。</Line>
<Line id="opening-3" hold={0.25}>为什么没有更积极？</Line>
    <Part id="heading" x={120} y={110} w={1680} h={100}><Title text="为什么是持有？"/></Part>
    <Part id="visual" x={120} y={240} w={1680} h={620}><Intro/></Part>
    <Animation>
      <Appear target={["ground","source","assumption","heading","visual"]} at="start" dur={0}/>
      <Tween target="visual" line="opening-2" word="持有" dur={1.4} to={{draw:1}}/>
    </Animation>
  </Scene>
  <Scene id="valuation">
    <Line id="price-1" hold={0.25}>先看这里，七十五点七九。</Line>
<Line id="price-2" hold={0.25}>这是报告记录的当时股价。</Line>
<Line id="price-3" hold={0.25}>我们就从这个位置出发。</Line>
    <Line id="base-1" hold={0.25}>再往右一点，八十点七九。</Line>
<Line id="base-2" hold={0.25}>这是基准估值。</Line>
<Line id="base-3" hold={0.25}>听起来高了一些，但到底高了多少？</Line>
    <Line id="gap-1" hold={0.25}>其实，只差五。</Line>
<Line id="gap-2" hold={0.25}>尺上这段绿色的距离，就是基准估值能多出来的空间。</Line>
    <Line id="percent-1" hold={0.25}>换成比例，也就是百分之六点六。</Line>
<Line id="percent-2" hold={0.25}>这么看，基准情景给出的空间，确实不算大。</Line>
    <Line id="bear-1" hold={0.25}>那如果事情没那么顺利呢？</Line>
<Line id="bear-2" hold={0.25}>把尺拉远，左边这个五十一点九一，是报告给出的悲观估值。</Line>
    <Line id="downside-1" hold={0.25}>这一下，就比当时股价低了百分之三十一点五。</Line>
<Line id="downside-2" hold={0.25}>你看，左边这段距离，明显比刚才那小段绿色长得多。</Line>
    <Line id="bull-1" hold={0.25}>当然，也有顺利的时候。</Line>
<Line id="bull-2" hold={0.25}>右边的一百二十四点七四，就是乐观估值，比当时股价高了约百分之六十四点六。</Line>
    <Line id="probability-1" hold={0.25}>但这里少了一块信息：每种情景，到底有多大可能发生？</Line>
<Line id="probability-2" hold={0.25}>原稿没有给出概率，所以我们还不能把最右边的数字当成预期。</Line>
    <Part id="heading" x={120} y={110} w={1680} h={100}><Title text="把估值放在同一条尺上"/></Part>
    <Part id="visual" x={120} y={240} w={1680} h={620}><Chart/></Part>
    <Animation>
      <Appear target={["heading","visual"]} at="start" dur={0}/>
      <Tween target="visual" line="price-1" word="七十五点七九" dur={0.6} to={{price:1}}/>
      <Tween target="visual" line="base-1" word="八十点七九" dur={2} to={{base:1}}/>
      <Tween target="visual" line="gap-1" word="只差五" dur={1.6} to={{gap:1}}/>
      <Tween target="visual" line="percent-1" word="百分之六点六" dur={1.5} to={{ratio:6.6}}/>
      <Tween target="visual" line="bear-2" word="把尺拉远" dur={2.8} to={{ratio:0,zoom:1}}/>
      <Tween target="visual" line="bear-2" word="五十一点九一" dur={2} to={{bear:1}}/>
      <Tween target="visual" line="downside-1" word="百分之三十一点五" dur={1.5} to={{ratio:-31.5}}/>
      <Set target="visual" line="bull-1" to={{ratio:0}}/>
      <Tween target="visual" line="bull-2" word="一百二十四点七四" dur={2.8} to={{bull:1}}/>
      <Tween target="visual" line="bull-2" word="百分之六十四点六" dur={1.5} to={{ratio:64.6}}/>
      <Set target="visual" line="probability-1" word="发生" to={{note:1}}/>
    </Animation>
  </Scene>
  <Scene id="opportunity">
    <Line id="drivers-1" hold={0.25}>往好的方向看，报告提到了中国二孩政策、行业进入壁垒，还有预计下降的乳品价格。</Line>
<Line id="drivers-2" hold={0.25}>这些，都是它看好的因素。</Line>
    <Part id="heading" x={120} y={110} w={1680} h={100}><Title text="机会来自哪里？"/></Part>
    <Part id="visual" x={120} y={240} w={1680} h={620}><Factors risk={false}/></Part>
    <Animation>
      <Appear target={["heading","visual"]} at="start" dur={0}/>
      <Tween target="visual" line="drivers-1" word="中国二孩政策" dur={0.6} to={{a:1}}/>
      <Tween target="visual" line="drivers-1" word="行业进入壁垒" dur={0.6} to={{b:1}}/>
      <Tween target="visual" line="drivers-1" word="预计下降" dur={0.6} to={{c:1}}/>
    </Animation>
  </Scene>
  <Scene id="risk">
    <Line id="risks-1" hold={0.25}>另一边，消费者的偏好在变，管理层的反应偏慢，业务也不够多样。</Line>
<Line id="risks-2" hold={0.25}>这些风险，原稿同样摆了出来。</Line>
    <Part id="heading" x={120} y={110} w={1680} h={100}><Title text="什么会让经营偏离预期？"/></Part>
    <Part id="visual" x={120} y={240} w={1680} h={620}><Factors risk={true}/></Part>
    <Animation>
      <Appear target={["heading","visual"]} at="start" dur={0}/>
      <Tween target="visual" line="risks-1" word="消费者" dur={0.6} to={{a:1}}/>
      <Tween target="visual" line="risks-1" word="管理层" dur={0.6} to={{b:1}}/>
      <Tween target="visual" line="risks-1" word="业务" dur={0.6} to={{c:1}}/>
    </Animation>
  </Scene>
  <Scene id="closing">
    <Line id="conclusion-1" hold={0.25}>所以，乐观情景确实诱人，但基准空间有限，向下的风险也得算进去。</Line>
<Line id="conclusion-2" hold={0.25}>这是我们结合原稿数字，对持有评级的一种理解。</Line>
    <Part id="heading" x={120} y={110} w={1680} h={100}><Title text="怎样理解 Hold？"/></Part>
    <Part id="visual" x={120} y={240} w={1680} h={620}><Chart complete/></Part>
    <Animation>
      <Appear target={["heading","visual"]} at="start" dur={0}/>
      <Set target="visual" at="start" to={{note:3}}/>
    </Animation>
  </Scene>
  <Scene id="qualification">
    <Line id="scope-1" hold={0.25}>最后留意一个细节：原稿的股价标加元，估值却只写了货币符号。</Line>
<Line id="scope-2" hold={0.25}>刚才的比例暂按同一口径计算，币种还需要核实。</Line>
    <Part id="heading" x={120} y={110} w={1680} h={100}><Title text="保留原稿的不确定性"/></Part>
    <Part id="visual" x={120} y={240} w={1680} h={620}><Chart complete/></Part>
    <Animation>
      <Appear target={["heading","visual"]} at="start" dur={0}/>
      <Set target="visual" at="start" to={{note:2}}/>
    </Animation>
  </Scene>
</Doc>;
