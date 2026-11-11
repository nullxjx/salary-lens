// 2026-11-11 情景参数快照；并非实时政策接口。所有比例为个人缴费比例。
const source=(title,url)=>({title,url});
const common={pensionRate:8,medicalRate:2,unemploymentRate:.5,medicalFixed:0,fundRate:12,supplementRate:0,deduction:0};
export const CITIES={
 beijing:{name:'北京',config:{...common,pensionCap:36348,medicalCap:36348,unemploymentCap:36348,fundCap:36348,medicalFixed:3},note:'普通企业职工；医保另计每月 3 元大额医疗互助。社保、公积金采用 2026 年 7 月起上限。',sources:[
 source('北京市政府：2026 社保基数上限','https://www.beijing.gov.cn/zhengce/zcjd/202608/t20260821_4831683.html'),
 source('北京市政府：2026 公积金缴存标准','https://www.beijing.gov.cn/fwcj/jiage/zffw1/685cd52595ff563574309b82.html'),
 source('房山区政府：养老与失业个人缴费比例','https://www.bjfsh.gov.cn/zsk/zcwd/202608/t20260818_40116625.shtml'),
 source('北京人社：医保个人 2% + 3 元（历史规则说明）','https://rsj.beijing.gov.cn/xwsl/mtgz/201912/t20191206_935045.html')]},
 shanghai:{name:'上海',config:{...common,pensionCap:37731,medicalCap:37731,unemploymentCap:37731,fundCap:37731,fundRate:7,supplementRate:5},note:'基础公积金双方各 5%–7%；补充公积金双方各 0%–5%（自愿参加）。默认 7% + 5%，不是人人都缴 12%。两部分分别按元取整。采用 2026 年 7 月起上限。',sources:[
 source('上海税务：2026 社保基数上限','https://shanghai.chinatax.gov.cn/tax/zcfw/rdwd/202608/t481376.html'),
 source('上海市政府：2026 公积金基数、比例及上下限','https://www.shanghai.gov.cn/gwk/affairs/content/0064%40f3d788ec72e9404ebcbf3d27fda98435'),
 source('上海市政府：企业职工个人社保比例','https://www.shanghai.gov.cn/nw17239/20251211/6a00e933de0347acbc172518d6bbab79.html')]},
 guangzhou:{name:'广州',config:{...common,pensionCap:27603,medicalCap:31170,unemploymentCap:42933,fundCap:41697,unemploymentRate:.2},note:'养老、医保、失业各自封顶，不能合用一个社保上限。采用 2026 下半年预设；医保为 2026 全年标准。部分数值取自媒体转载，未取得可访问的主管部门原文，使用前请确认。长护险从医保个人账户扣缴，不重复扣现金。',sources:[
 source('媒体预设：2026 广州各险种基数与比例','https://m.gz.bendibao.com/life/206730.html?src=amap'),
 source('媒体转载：2026 广州公积金基数及按元取整指引','https://gz.bendibao.com/life/202673/369704.shtml'),
 source('广州市政府公报：长护险个人账户扣缴','https://www.gz.gov.cn/attachment/7/7552/7552391/9488125.pdf')]},
 shenzhen:{name:'深圳',config:{...common,pensionCap:27603,medicalCap:33633,unemploymentCap:48471,fundCap:48471,unemploymentRate:.2},note:'默认职工医保一档（个人 2%），可切换二档（0.5%），不代表个人可任意选择参保档次。养老采用 2026 年 7 月起、失业采用 9 月起上限；医保为 2026 全年标准。部分上限为媒体预设，请对照工资单核实。',sources:[
 source('媒体预设：广东 2026 养老上限','https://www.xiaozhutax.com/shebao/shenzhen.html'),
 source('深圳市政府：2026 医保基数上下限','https://www.sz.gov.cn/hdjlpt/detail?pid=3336522&via=pc'),
 source('深圳医保局：一档、二档个人比例','https://hsa.sz.gov.cn/gkmlpt/content/10/10979/post_10979462.html'),
 source('媒体预设：2026 年 9 月起失业基数与比例','https://m.bendibao.com/mip/bsy616048.html'),
 source('媒体预设：2026 公积金上限','https://m.bendibao.com/bsy637790.html'),
 source('深圳住建局：公积金按元取整核算表','https://zjj.sz.gov.cn/attachment/1/1702/1702924/12732651.pdf')]},
 hangzhou:{name:'杭州',config:{...common,pensionCap:25611,medicalCap:25611,unemploymentCap:25611,fundCap:42151},note:'保留原杭州测算口径；公积金上限采用 2026 年 7 月至 2027 年 6 月标准。社保上限为媒体预设，省厅原文未能直接访问，请以经办机构为准。大病保险从医保个人账户扣缴，不重复扣现金。',sources:[
 source('媒体预设：2026 浙江社保基数及比例','https://i.ifeng.com/c/8x3dUCkb3G6'),
 source('杭州网转载：2026 公积金上限','https://hznews.hangzhou.com.cn/jingji/content/2026-07/25/content_9263759.htm'),
 source('杭州政府公报：公积金按元取整','https://zfgb.hangzhou.gov.cn/15/105220253/t131220253054/524731.shtml')]}
};
export function cityConfig(id){if(!CITIES[id])throw new RangeError('不支持的城市');return {...CITIES[id].config,city:id};}
