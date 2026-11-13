const { taskSpace } = globalThis;
const fsp = await import("node:fs/promises");
const nodePath = await import("node:path");
const { fileURLToPath } = await import("node:url");

const ROOT = nodePath.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = `${ROOT}/logs`;
const STATE_FILE = `${ROOT}/state.json`;
const CONFIG_FILE = `${ROOT}/config.json`;

const CONFIG = Object.assign(
  { studySeconds: 25 * 60 },
  await (async () => {
    try {
      return JSON.parse(await fsp.readFile(CONFIG_FILE, "utf8"));
    } catch {
      return {};
    }
  })(),
);
const STUDY_SECONDS = CONFIG.studySeconds;

const COURSES = {
  military: {
    key: "military",
    name: "军事理论",
    courseId: "1000006950",
    recruitId: "471937",
    secret: "YOUR_MILITARY_SECRET",
    videoStrategy: "random",
  },
  security: {
    key: "security",
    name: "大学生国家安全教育",
    courseId: "1000070194",
    recruitId: "456322",
    secret: "YOUR_SECURITY_SECRET",
    videoStrategy: "unfinishedFirst",
  },
};

const studyUrl = (c) => `https://studyvideoh5.zhihuishu.com/stuStudy?recruitAndCourseId=${c.secret}`;
const qaUrl = (c) => `https://qah5.zhihuishu.com/qa.html#/web/home/${c.courseId}?role=2&recruitId=${c.recruitId}&fromUrl=2`;

const TOPICS = {
  military: [
    { keys: ["国防是什么", "国防的概念", "国防的含义", "什么是国防", "国防的要素", "国防的类型"], answers: [
      "国防是国家为防备和抵抗侵略、制止武装颠覆和分裂、保卫国家主权统一领土完整和安全所进行的军事活动，以及与军事有关的政治、经济、外交、科技、教育等活动。其基本要素包括国防主体、国防对象、国防目的和国防手段，四者相互联系，缺一不可。",
      "国防伴随国家产生而产生，是国家生存与发展的安全保障。它既包括军事斗争准备，也包括国防教育、国防动员、国防科技和后备力量建设。理解国防要把握三点：主体是国家，对象是外来侵略和武装颠覆，目的是捍卫主权、统一、领土完整和安全。",
    ]},
    { keys: ["国防教育", "国防意识", "忧患意识", "国防观念"], answers: [
      "国防教育是面向全体公民的全民教育、全程教育。通过学校教育、社会宣传、军事训练等途径，帮助公民掌握国防知识、增强国防观念、提高履行国防义务的自觉性。大学生军训和军事理论课就是国防教育的重要载体，它能培养忧患意识和家国情怀，为国防建设提供人才和思想基础。",
      "国防教育不是单纯的知识灌输，而是国家认同和责任意识的培育。它贯穿人的一生，覆盖学校、家庭和社会各个层面。开展国防教育要结合形势政策、历史教育和实践活动，使公民既了解国家安全面临的挑战，又掌握基本的防护和动员知识，形成关心国防、热爱国防、建设国防的社会氛围。",
    ]},
    { keys: ["武装力量", "解放军", "武警", "民兵", "军兵种", "三大部分"], answers: [
      "我国武装力量由中国人民解放军、中国人民武装警察部队和民兵组成。解放军是主要力量，担负巩固国防、抵抗侵略、保卫祖国、保卫人民和平劳动的任务；武警担负维护国家安全和社会稳定、海上维权执法等任务；民兵是不脱离生产的群众武装，是解放军的助手和后备力量。三者相结合是我国武装力量体制的特色。",
      "人民解放军包括现役部队和预备役部队，军种有陆军、海军、空军、火箭军和战略支援部队；武警由内卫、机动和海警等力量构成；民兵分为基干民兵和普通民兵，平时参加建设、维护治安，战时参军参战、支援前线。这一体制体现了主力军、地方军和群众武装相结合的优势。",
    ]},
    { keys: ["动员", "国防动员", "人民防空"], answers: [
      "国防动员是国家为应对战争或其他安全威胁，使社会诸领域全部或部分由平时状态转入战时状态的活动。内容包括武装力量动员、国民经济动员、人民防空动员、交通战备动员和政治动员等。其目的是把国家潜力转化为战争实力，保障战争需要，减少战争损失。",
      "国防动员体系包括动员领导体制、法律法规、预案和保障能力建设。平时要做好动员潜力调查、物资储备和专业力量建设，战时按照统一指挥、快速高效的原则实施。人民防空是动员的重要内容，城市防空袭、疏散和掩蔽能力直接关系民众生命安全。",
    ]},
    { keys: ["军事思想", "孙子兵法", "人民战争", "战争观", "毛泽东军事思想"], answers: [
      "军事思想是关于战争、军队和国防问题的理性认识，包括战争观、方法论、战略战术原则等。它来源于战争实践，又指导战争实践。中国古代《孙子兵法》提出知己知彼、不战而屈人之兵等思想；毛泽东军事思想强调人民战争和灵活机动的战略战术，至今仍有重要指导意义。",
      "学习和研究军事思想，重点是掌握观察战争问题的立场和方法。军事思想具有阶级性、实践性和时代性，随着武器装备和战争形态的发展不断丰富。新时代党的强军思想把军事思想推进到新境界，强调政治建军、改革强军、科技强军、人才强军、依法治军。",
    ]},
    { keys: ["积极防御", "军事战略", "战略方针", "防御"], answers: [
      "积极防御又称攻势防御，是我军一贯坚持的战略思想。战略上坚持防御、自卫和后发制人，不主动挑起战争；战役战斗上强调以积极攻势行动达成防御目的，把防御与进攻统一起来。其核心是后发制人、攻防结合，平时充分准备，战时夺取和保持主动权。",
      "积极防御不是消极等待，而是防御中有进攻、被动中有主动。它要求战略上后发制人，战役战斗上先机制敌；既坚持人不犯我、我不犯人，又做到人若犯我、我必犯人。我国的国防政策坚持防御性，根本目的是捍卫主权、安全和发展利益，维护和平稳定的发展环境。",
    ]},
    { keys: ["信息化战争", "信息战", "高技术战争", "现代战争", "智能化战争"], answers: [
      "信息化战争是以信息为主导、以信息系统为支撑的战争形态。主要特征是：战场感知实时化，指挥控制网络化，作战行动精确化，力量运用一体化，作战空间多维化。信息优势成为夺取主动权的关键，制信息权直接影响战争进程和结局。",
      "与传统战争相比，信息化战争不再是单一军种的平台对抗，而是体系与体系的较量。它强调侦察预警、指挥控制、火力打击和综合保障的一体联动，注重心理战、舆论战和法律战。随着智能化技术发展，无人作战、算法对抗等新样式不断涌现，战争形态正加速演变。",
    ]},
    { keys: ["国防建设", "军队建设", "改革强军", "国防现代化", "强军目标"], answers: [
      "国防建设包括武装力量建设、国防科技工业、国防动员、人民防空、国防教育和国防法制等方面。要坚持国防建设与经济建设协调发展，在经济发展的基础上推进国防现代化。新时代要贯彻改革强军战略，优化军事力量结构，提高基于网络信息体系的联合作战能力。",
      "国防建设必须服从国家发展战略，做到富国与强军相统一。重点是提高武器装备现代化水平，培养高素质军事人才，完善国防动员体系，健全国防法规。国防建设还要与科技创新相结合，推动军民融合深度发展，形成全要素、多领域、高效益的融合格局。",
    ]},
    { keys: ["总体国家安全观", "国家安全观", "国家安全"], answers: [
      "总体国家安全观以人民安全为宗旨，以政治安全为根本，以经济安全为基础，以军事、科技、文化、社会安全为保障，以促进国际安全为依托。它涵盖政治、国土、军事、经济、文化、社会、科技、网络、生态、资源、核、海外利益、生物、人工智能等多个领域，强调统筹发展和安全。",
      "总体国家安全观的关键是总体，要求把各领域安全作为一个有机整体来谋划，做到既重视外部安全又重视内部安全，既重视国土安全又重视国民安全，既重视传统安全又重视非传统安全，既重视自身安全又重视共同安全。它既是认识论，也是方法论。",
    ]},
    { keys: ["领土", "主权", "领海", "领空", "边界", "海洋权益"], answers: [
      "领土是国家行使主权的空间，包括领陆、领水、领空和底土。主权是国家独立自主处理内外事务的最高权力，具有独立性、平等性和不可侵犯性。我国坚持领土完整不容分割，通过外交谈判、法律斗争和必要防卫手段维护领土主权和海洋权益。",
      "领海是沿海国主权管辖下的海域，我国主张12海里领海和200海里专属经济区。领空指领土之上的空气空间，国家对其享有完全排他的主权。维护领土主权既要坚持原则立场，也要善于运用国际法和国际规则，通过和平方式解决争端。",
    ]},
    { keys: ["甲午", "鸦片战争", "近代", "历史教训", "抗日战争"], answers: [
      "近代中国有国无防、任人宰割，鸦片战争、甲午战争等失败说明落后就要挨打。历史教训表明，国防强弱直接关系国家兴衰和民族存亡。今天我们加强国防建设，不是为了扩张，而是为了避免历史悲剧重演，为国家发展提供安全保障。",
      "从甲午海战北洋水师覆没，到抗日战争全民族奋起，历史反复证明：没有强大的国防，就没有国家的尊严和人民的安宁。铭记历史不是延续仇恨，而是汲取教训、增强忧患意识，把爱国之情转化为支持和参与国防建设的实际行动。",
    ]},
    { keys: ["军民融合", "国防科技工业", "国防经济"], answers: [
      "军民融合是国家把国防建设融入经济社会发展体系的战略举措，目的是实现资源统筹、优势互补。内容包括科技、产业、人才、基础设施、社会服务等领域的融合。它有利于降低国防成本、加快技术进步，也有利于经济高质量发展。",
      "推动军民融合深度发展，要完善体制机制，打破行业壁垒，促进军地资源双向流动。重点在武器装备科研生产、卫星遥感、通信导航、应急应战等领域形成合力。融合不是简单的军转民或民参军，而是全要素、多领域的体系融合。",
    ]},
    { keys: ["国际形势", "地缘", "周边安全", "俄乌", "国际环境", "百年未有"], answers: [
      "当前国际形势复杂多变，霸权主义、强权政治依然存在，地缘冲突和地区热点此起彼伏，非传统安全威胁上升。我国周边安全环境总体稳定，但存在领土海洋权益争端、外部军事存在等挑战。维护国家安全既要增强自身实力，也要坚持对话合作、推动构建人类命运共同体。",
      "世界正经历百年未有之大变局，国际力量对比深刻调整，科技竞争日趋激烈。面对外部遏制打压和周边复杂因素，我国坚持独立自主的和平外交政策，坚持防御性国防政策，同时加快提升维护国家主权、安全和发展利益的能力。",
    ]},
    { keys: ["义务", "服兵役", "参军", "公民", "大学生", "国防责任"], answers: [
      "履行国防义务是宪法和法律规定的公民责任。主要包括：依法服兵役和参加民兵组织，接受国防教育，保护国防设施和军事秘密，支持国防建设、拥军优属，战时服从动员、参加支前和救护等。国防义务与国防权利相统一，人人有责。",
      "大学生履行国防义务，可以从认真参加军事理论课和军训做起，学习国防知识，增强纪律观念；积极报名参军入伍，到部队建功立业；平时遵守保密规定，不随意拍摄传播军事设施信息；关心国防建设，传播正能量。",
    ]},
    { keys: ["武器", "装备", "航母", "导弹", "无人机", "人工智能"], answers: [
      "武器装备是军队现代化的重要标志。近年来我国航母、隐身战机、无人机、导弹等装备快速发展，体系作战能力明显提升。但武器装备只是战斗力的一部分，还要靠人的素质、编制体制和实战化训练，实现人与武器的最佳结合。",
      "高技术武器装备改变了作战方式，提高了打击精度和作战效能，但也带来成本高、保障复杂等问题。发展装备要坚持需求牵引、体系设计，注重自主创新和实战检验。同时要看到，决定战争胜负的根本因素是人，而不是一两件新式武器。",
    ]},
    { keys: ["党的领导", "党对军队", "绝对领导", "政治建军"], answers: [
      "坚持党对军队的绝对领导是我国的根本军事制度，是人民军队的建军之本、强军之魂。它保证军队始终听从党中央、中央军委指挥，保持人民军队性质宗旨。这一原则由宪法和法律确认，是维护国家长治久安的重要保证。",
      "党对军队绝对领导通过党委制、政治委员制、政治机关制等制度落实，做到绝对忠诚、绝对纯洁、绝对可靠。离开党的领导，军队就会失去灵魂和方向。新时代坚持这一原则，就是要确保枪杆子永远掌握在忠于党和人民的人手中。",
    ]},
  ],
  security: [
    { keys: ["总体国家安全观", "国家安全观", "什么是国家安全", "五对关系", "五大要素"], answers: [
      "总体国家安全观以人民安全为宗旨，以政治安全为根本，以经济安全为基础，以军事、科技、文化、社会安全为保障，以促进国际安全为依托。它强调统筹发展和安全，把各领域安全作为一个整体来谋划，是新时代国家安全工作的根本遵循。",
      "总体国家安全观的关键在总体。它要求既重视外部安全又重视内部安全，既重视国土安全又重视国民安全，既重视传统安全又重视非传统安全，既重视自身安全又重视共同安全，既重视发展问题又重视安全问题，形成维护国家安全的整体合力。",
    ]},
    { keys: ["政治安全", "政权", "意识形态", "制度安全"], answers: [
      "政治安全是总体国家安全观的根本，核心是维护国家政权安全和制度安全，坚持党的领导，维护中国特色社会主义制度。要防范敌对势力渗透颠覆，抵制错误思潮，增强政治敏锐性和鉴别力。政治安全一旦失守，其他领域安全就失去依托。",
      "维护政治安全，要坚持马克思主义在意识形态领域的指导地位，培育和践行社会主义核心价值观，依法打击危害国家政治安全的活动。对青年学生来说，要坚定理想信念，不信谣不传谣，自觉抵制历史虚无主义等错误观点。",
    ]},
    { keys: ["网络安全", "网络攻击", "网络谣言", "网络空间"], answers: [
      "网络安全是国家安全的重要领域。主要风险包括网络攻击、数据泄露、电信诈骗、网络谣言和意识形态渗透。维护网络安全要加强关键信息基础设施保护，提高个人信息保护意识，不点击陌生链接，不随意授权，发现危害国家安全的网络行为及时举报。",
      "没有网络安全就没有国家安全。维护网络安全要坚持依法管网、依法治网，提升技术防护和应急处置能力；同时每个网民都要文明上网，保护账号密码，警惕钓鱼网站和恶意软件，不传播未经证实的信息。",
    ]},
    { keys: ["大学生", "青年", "学生", "日常"], answers: [
      "大学生维护国家安全，要增强国家安全意识，认真学习总体国家安全观；遵守法律法规和校规，不参与非法组织活动；保护国家秘密和科研数据，不在网上传播敏感信息；警惕境外势力的拉拢利诱；发现可疑情况拨打12339举报。",
      "青年学生可以从身边做起：参加国家安全教育活动，了解相关法律；规范网络言行，不随意发布涉密或敏感信息；出国交流、求职兼职时提高警惕，防止被利用；把爱国热情转化为维护国家安全的实际行动。",
    ]},
    { keys: ["生物安全", "传染病", "公共卫生", "疫情"], answers: [
      "生物安全涉及传染病防控、生物技术应用、实验室管理、外来物种入侵等方面。它直接关系人民生命健康和生态稳定。维护生物安全要健全法律法规和监测预警体系，规范生物技术研究应用，提高公共卫生应急能力，防止生物武器和生物恐怖威胁。",
      "生物安全是国家安全的新领域。要完善生物安全风险防控和治理体系，加强病原微生物实验室监管，推进疫苗和药物研发，防范重大新发突发传染病。同时要增强公众防护意识，养成良好卫生习惯。",
    ]},
    { keys: ["文化安全", "文化自信", "传统文化", "价值观"], answers: [
      "文化安全是国家安全的精神屏障，核心是维护国家文化主权和意识形态安全，传承中华优秀传统文化，培育社会主义核心价值观。要警惕文化渗透和历史虚无主义，增强文化自信，提高辨别能力，同时推动文化交流互鉴。",
      "维护文化安全，要坚持以我为主、为我所用，推动中华优秀传统文化创造性转化、创新性发展。面对外来文化，既不能盲目排外，也不能全盘接受，要在交流中保持定力，讲好中国故事。",
    ]},
    { keys: ["发展", "安全发展", "统筹"], answers: [
      "发展和安全是一体之两翼。发展是安全的基础，安全是发展的条件。要坚持统筹发展和安全，在发展中防范化解风险，在安全中保障发展。既要善于运用发展成果夯实安全基础，又要善于运用安全手段营造发展环境。",
      "安全是发展的前提，发展是安全的保障。只讲发展不讲安全，发展成果可能毁于一旦；只讲安全不讲发展，安全也会失去物质基础。要把握好两者平衡，做到同谋划、同部署、同推进。",
    ]},
    { keys: ["反间谍", "间谍", "12339", "保密"], answers: [
      "公民有维护国家安全、保守国家秘密的义务。发现间谍行为或其他危害国家安全的活动，应当及时向国家安全机关报告，举报电话12339。任何公民和组织都不得非法持有、使用间谍器材，不得为境外机构窃取、刺探、收买、非法提供国家秘密。",
      "反间谍工作需要专门机关与群众路线相结合。日常生活中要增强保密意识，不随意谈论涉密事项，不在军事管理区拍照摄像，对以咨询、兼职、交友为名打探敏感信息的行为保持警惕，发现问题及时举报。",
    ]},
    { keys: ["数据安全", "个人信息", "隐私"], answers: [
      "数据已成为基础性战略资源。数据安全涉及个人信息保护、重要数据出境、关键信息基础设施安全等。维护数据安全要落实数据分类分级保护制度，加强跨境数据流动管理，惩治数据窃取和滥用行为，防止数据被用于危害国家安全的活动。",
      "保护数据安全，个人要做到不随意填写身份证号、银行卡号等敏感信息，谨慎授权应用权限，定期更换密码；企业和机构要落实网络安全等级保护制度，重要数据出境依法进行安全评估。",
    ]},
    { keys: ["生态安全", "环境", "资源安全", "双碳"], answers: [
      "生态安全是指生态系统能够支撑经济社会可持续发展的状态。大气、水、土壤污染和生物多样性减少都会威胁国家安全。维护生态安全要践行绿水青山就是金山银山理念，加强生态环境保护，推进碳达峰碳中和，防范生态环境风险。",
      "生态安全与资源安全紧密相关。要统筹山水林田湖草沙系统治理，守住耕地红线，保障能源资源供应，防止外来物种入侵，提高生态系统质量和稳定性，为经济社会发展提供可持续的支撑。",
    ]},
    { keys: ["海外利益", "一带一路", "领事保护"], answers: [
      "随着对外开放扩大，我国海外公民、机构、资产和能源资源通道安全日益重要。维护海外利益安全，要完善领事保护机制，加强海上通道安全保障，推动共建一带一路高质量发展，通过国际合作维护我国正当权益。",
      "海外利益安全是国家安全的重要组成部分。要健全境外投资风险防控体系，加强海外安保力量建设，完善应急撤离和救援机制，同时推动构建人类命运共同体，为海外利益提供良好国际环境。",
    ]},
    { keys: ["科技安全", "核心技术", "卡脖子", "自主创新"], answers: [
      "科技安全是国家安全的重要保障。关键核心技术受制于人，就会在竞争中处于被动。维护科技安全要加强自主创新，突破卡脖子技术，保护知识产权和科技秘密，防范技术窃取，同时积极参与全球科技治理。",
      "科技安全贯穿于经济、军事、网络等各个领域。要完善国家创新体系，加强基础研究和人才培养，健全科技安全风险监测预警机制，依法保护科研成果，防止关键技术外流。",
    ]},
    { keys: ["社会安全", "治安", "公共安全", "食品药品"], answers: [
      "社会安全包括社会治安、公共安全、食品药品安全、防灾减灾等方面，直接关系人民群众生命财产安全。维护社会安全要健全公共安全体系，化解社会矛盾，加强应急管理，依法打击各类违法犯罪，营造安定有序的社会环境。",
      "社会安全是国家安全的晴雨表。要坚持和发展新时代枫桥经验，把矛盾化解在基层；完善安全生产责任制，加强重点行业监管；提升突发事件应急处置能力，保障群众基本生活和社会秩序稳定。",
    ]},
    { keys: ["教育日", "415", "4月15日", "国家安全法"], answers: [
      "2015年7月1日颁布的《国家安全法》确定每年4月15日为全民国家安全教育日。设立这一节日，是为了增强全民国家安全意识，推动全社会共同维护国家安全。每年围绕不同主题开展宣传教育活动。",
      "全民国家安全教育日期间，各地通过讲座、展览、知识竞赛、新媒体宣传等形式普及国家安全知识。大学生应积极参加相关活动，了解国家安全法律法规，明确公民的权利义务。",
    ]},
    { keys: ["渗透", "境外势力", "拉拢", "策反"], answers: [
      "境外势力常以学术交流、资助项目、网络交友等名义进行意识形态渗透和情报搜集。防范渗透要保持警惕，不泄露涉密信息，不参加来历不明的组织活动，对异常接触及时报告；同时要增强辨别能力，不信谣不传谣。",
      "反渗透斗争是长期的。要害部门、涉密岗位人员要严格遵守保密纪律；普通公民也要提高警惕，警惕高薪兼职、免费旅游等诱饵，避免被利用从事危害国家安全的活动。",
    ]},
    { keys: ["经济安全", "粮食安全", "能源安全", "金融"], answers: [
      "经济安全是国家安全的基础，包括粮食安全、能源安全、金融安全、产业链供应链安全等。维护经济安全要稳住粮食和能源基本盘，防范系统性金融风险，增强产业链韧性，掌握关键核心技术，提高抵御外部冲击的能力。",
      "经济安全的核心是保持经济平稳健康发展。要坚持底线思维，保障重要农产品和能源资源供给，维护金融稳定，提升产业基础高级化和产业链现代化水平，在开放中增强抗风险能力。",
    ]},
    { keys: ["军事安全", "国防", "军队"], answers: [
      "军事安全是国家安全的坚强后盾。它要求建设强大国防和军队，提高捍卫国家主权、安全、发展利益的能力。军事安全与其他领域安全相互支撑，既要加强战备训练和武器装备建设，也要通过战略沟通降低误判风险。",
      "军事安全不仅指打赢战争的能力，也包括威慑和危机管控能力。要坚持防御性国防政策，推进国防和军队现代化，加强军地协同，为国家安全提供可靠保障。",
    ]},
    { keys: ["核安全", "核", "辐射"], answers: [
      "核安全是国家安全的重要组成部分，涉及核材料管制、核设施安全、放射性污染防治和核应急。维护核安全要坚持安全第一，健全监管体系，提高应急能力，反对核扩散和核恐怖主义，支持和平利用核能。",
      "核安全无小事。要严格执行核安全法规和标准，加强核设施运行监管和放射性废物管理，完善核事故应急预案，同时积极参与国际核安全合作。",
    ]},
    { keys: ["恐怖", "反恐", "暴恐"], answers: [
      "恐怖主义是危害国家安全的严重威胁。我国反恐坚持依法打击、标本兼治，加强情报预警、边境管控和重点目标防范，同时通过去极端化教育消除滋生土壤。公民发现涉恐线索应及时向公安机关举报。",
      "反恐工作要坚持专门工作与群众路线相结合。在公共场所遇到可疑人员、可疑物品应保持警惕，配合安检，记住报警电话110，不传播未经证实的涉恐信息。",
    ]},
    { keys: ["南海", "台湾", "新疆", "西藏", "领土", "主权"], answers: [
      "维护国家领土主权和海洋权益，是国家安全的基本要求。我国坚持一个中国原则，坚决反对任何形式的分裂活动；在南海等问题上坚持通过对话协商解决争端，同时坚定维护自身合法权益。",
      "国家主权和领土完整不容侵犯。要坚持和平统一、一国两制方针，坚决反对台独分裂行径和外部势力干涉；加强边疆治理，促进民族团结，筑牢维护国家统一和领土完整的坚实屏障。",
    ]},
  ],
};

const QUESTIONS = {
  military: [
    "简述国防的基本要素及其相互关系？",
    "我国武装力量由哪几部分组成，各自承担什么任务？",
    "为什么说国防教育是全民教育？",
    "积极防御战略思想的核心内涵是什么？",
    "信息化战争有哪些主要特征？",
    "国防动员主要包括哪些内容？",
    "如何理解军民融合发展战略？",
    "新时代国防和军队建设的目标是什么？",
    "公民履行国防义务有哪些具体方式？",
    "我国周边安全环境面临哪些挑战？",
    "人民战争思想在现代条件下还有哪些价值？",
    "军事思想对战争实践有什么指导作用？",
    "如何看待高技术武器装备对战争形态的影响？",
    "国防建设与经济建设为什么要协调发展？",
    "我国国防领导体制是如何构成的？",
    "简述我国军事战略方针的基本内容？",
    "为什么必须坚持党对军队的绝对领导？",
    "现代战争中制信息权为什么重要？",
    "如何评价孙子兵法对后世的影响？",
    "大学生应如何增强国防观念？",
    "结合专业谈谈如何为国防建设作贡献？",
    "简述我国国防的基本类型和特征？",
    "现代战争条件下人民防空有哪些新要求？",
    "如何认识军队组织形态现代化的重要性？",
    "为什么说科技是现代战争的核心战斗力？",
  ],
  security: [
    "总体国家安全观包括哪些主要内容？",
    "为什么要把政治安全放在首位？",
    "网络安全面临哪些主要风险？",
    "大学生在日常生活中如何维护国家安全？",
    "什么是生物安全，为什么重要？",
    "文化安全与国家安全有什么联系？",
    "如何理解发展和安全的辩证关系？",
    "反间谍工作中公民有哪些义务？",
    "数据安全为什么成为国家安全的新领域？",
    "生态安全对国家安全有什么意义？",
    "海外利益安全面临哪些挑战？",
    "科技安全在国家安全体系中处于什么地位？",
    "社会安全主要包括哪些方面？",
    "全民国家安全教育日的由来和意义是什么？",
    "如何防范境外势力的渗透？",
    "经济安全与国家安全是什么关系？",
    "军事安全在国家安全体系中起什么作用？",
    "核安全为什么不容忽视？",
    "总体国家安全观中的五对关系指什么？",
    "青年学生应树立怎样的国家安全意识？",
    "结合校园生活谈谈身边的网络安全风险？",
    "为什么说国家安全人人有责？",
    "简述非传统安全威胁的主要表现？",
    "如何理解以人民安全为宗旨？",
    "人工智能发展带来哪些国家安全新课题？",
  ],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, "0");
const d0 = new Date();
const DAY = `${d0.getFullYear()}-${pad(d0.getMonth() + 1)}-${pad(d0.getDate())}`;
const LOG_FILE = `${LOG_DIR}/${DAY}.log`;
const STOP_FILE = `${ROOT}/stop.flag`;
const logLines = [];
let errors = [];
try {
  await fsp.mkdir(LOG_DIR, { recursive: true });
} catch {}
try {
  await fsp.rm(STOP_FILE, { force: true });
} catch {}

class StopRequested extends Error {}
async function stopRequested() {
  try {
    await fsp.access(STOP_FILE);
    return true;
  } catch {
    return false;
  }
}
async function ensureRunning() {
  if (await stopRequested()) throw new StopRequested();
}

const STATUS_FILE = `${ROOT}/status.json`;
const status = {
  running: false,
  pid: process.pid,
  day: DAY,
  startedAt: null,
  updatedAt: null,
  stage: "idle",
  step: "等待启动",
  currentCourse: null,
  courses: {
    military: { name: "军事理论", studySeconds: 0, target: STUDY_SECONDS, question: null, answers: 0, state: "idle" },
    security: { name: "大学生国家安全教育", studySeconds: 0, target: STUDY_SECONDS, question: null, answers: 0, state: "idle" },
  },
  logs: [],
};

async function writeStatus(patch) {
  if (patch) Object.assign(status, patch);
  status.updatedAt = new Date().toISOString();
  status.logs = logLines.slice(-40);
  try {
    await fsp.writeFile(STATUS_FILE, JSON.stringify(status, null, 2), "utf8");
  } catch {}
}

function log(...args) {
  const s = args.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" ");
  const line = `[${new Date().toLocaleTimeString("zh-CN", { hour12: false })}] ${s}`;
  console.log(line);
  logLines.push(line);
  fsp.appendFile(LOG_FILE, line + "\n", "utf8").catch(() => {});
}

async function flushLog() {
  try {
    await fsp.mkdir(LOG_DIR, { recursive: true });
    await fsp.writeFile(LOG_FILE, logLines.join("\n") + "\n", "utf8");
  } catch (e) {
    console.error("写日志失败", e.message);
  }
}

async function loadState() {
  try {
    return JSON.parse(await fsp.readFile(STATE_FILE, "utf8"));
  } catch {
    return { days: {}, asked: {}, answered: {} };
  }
}

async function saveState(state) {
  await fsp.mkdir(ROOT, { recursive: true });
  await fsp.writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100000007;
  return h;
}

function pickAnswer(courseKey, title, used = new Set()) {
  const topics = TOPICS[courseKey];
  for (const t of topics) {
    if (t.keys.some((k) => title.includes(k))) {
      const start = hash(title) % t.answers.length;
      for (let i = 0; i < t.answers.length; i++) {
        const a = t.answers[(start + i) % t.answers.length];
        if (!used.has(a)) return a;
      }
      return t.answers[start];
    }
  }
  return null;
}

function pickQuestion(courseKey, state) {
  const bank = QUESTIONS[courseKey];
  const used = new Set(state.asked[courseKey] || []);
  const fresh = bank.filter((q) => !used.has(q));
  const pool = fresh.length ? fresh : bank;
  return pool[hash(DAY + courseKey) % pool.length];
}

async function hasText(page, text) {
  try {
    return await page.evaluate((t) => document.body.innerText.includes(t), text);
  } catch {
    return false;
  }
}

async function isLoginPage(page) {
  try {
    const url = await page.url();
    if (url.includes("login.zhihuishu.com")) return true;
    return await page.evaluate(() => /扫码登录|手机号登录|请登录/.test(document.body.innerText));
  } catch {
    return false;
  }
}

async function safeClick(page, selector, label) {
  try {
    await page.click(selector, { label });
    return true;
  } catch (e) {
    return false;
  }
}

async function dismissStudyPopups(page) {
  for (let i = 0; i < 4; i++) {
    let acted = false;
    if (await page.evaluate(() => !!document.querySelector(".dialog-read"))) {
      if (!(await page.evaluate(() => {
        const d = document.querySelector(".dialog-read");
        return !d || getComputedStyle(d).display === "none";
      }))) {
        acted = (await safeClick(page, "loc=css:.dialog-read .iconguanbi", "关闭学前必读")) || acted;
      }
    }
    if (await hasText(page, "已绑定，不再提示")) {
      acted = (await safeClick(page, 'text="已绑定，不再提示"', "关闭课程提醒")) || acted;
    } else if (await hasText(page, "下次再说")) {
      acted = (await safeClick(page, 'text="下次再说"', "关闭提醒弹窗")) || acted;
    }
    if (await hasText(page, "不再提示")) {
      await page.evaluate(() => {
        const a = [...document.querySelectorAll("a")].find((x) => x.textContent.trim() === "不再提示");
        if (a) a.click();
      });
      acted = true;
    }
    if (!acted) break;
    await sleep(900);
  }
}

const videoState = (page) =>
  page.evaluate(() => {
    const v = document.querySelector("video");
    const dlg = document.querySelector("#playTopic-dialog");
    return v
      ? {
          paused: v.paused,
          t: v.currentTime,
          d: v.duration,
          quiz: !!dlg && dlg.offsetHeight > 0,
          chapter: ((document.querySelector("li.clearfix.video.current_play .catalogue_title") || {}).textContent || "").trim(),
        }
      : null;
  });

async function dismissMessageBox(page) {
  const text = await page.evaluate(() => {
    const box = [...document.querySelectorAll(".el-message-box")].find((d) => d.offsetHeight > 0);
    return box ? box.innerText.replace(/\s+/g, " ").slice(0, 80) : null;
  });
  if (!text) return null;
  await safeClick(page, "loc=css:.el-message-box__wrapper button", "关闭提示框");
  await sleep(800);
  return text;
}

// 弹题答对答错不计成绩，随机选一个选项后点关闭
async function closeQuiz(page) {
  await dismissMessageBox(page);
  const quiz = await page.evaluate(() => {
    const dlg = document.querySelector("#playTopic-dialog");
    if (!dlg || !dlg.offsetHeight) return null;
    return { count: dlg.querySelectorAll("li.topic-item").length };
  });
  if (!quiz) return true;

  for (let attempt = 0; attempt < 2; attempt++) {
    if (quiz.count > 0) {
      const idx = Math.floor(Math.random() * quiz.count);
      await safeClick(page, `loc=css:#playTopic-dialog li.topic-item >> nth=${idx}`, "选择弹题答案");
      await sleep(1200);
      log(`弹题随机选择第 ${idx + 1} 个选项（共 ${quiz.count} 个）`);
    }
    await safeClick(page, "loc=css:#playTopic-dialog .dialog-footer .btn", "关闭弹题");
    await sleep(1800);
    const state = await page.evaluate(() => {
      const dlg = document.querySelector("#playTopic-dialog");
      const box = [...document.querySelectorAll(".el-message-box")].find((d) => d.offsetHeight > 0);
      return {
        open: !!dlg && dlg.offsetHeight > 0,
        msg: box ? box.innerText.replace(/\s+/g, " ").slice(0, 80) : null,
      };
    });
    if (!state.open) {
      await sleep(800);
      await page.mouse.click(430, 380, { label: "继续播放" });
      return true;
    }
    if (state.msg) {
      log(`弹题未关闭：${state.msg}`);
      await dismissMessageBox(page);
    }
  }
  await page.mouse.click(430, 380, { label: "继续播放" });
  return false;
}

async function chapterList(page) {
  return page.evaluate(() => {
    const items = [...document.querySelectorAll("li.clearfix.video")];
    return {
      current: items.findIndex((li) => li.className.includes("current_play")),
      list: items.map((li, i) => {
        const t = li.querySelector(".catalogue_title");
        const no = li.querySelector(".catalogue_title3 b");
        return {
          i,
          no: no ? no.textContent.trim() : "",
          title: ((t && (t.getAttribute("title") || t.textContent)) || "").trim(),
          done: !!li.querySelector(".time_icofinish"),
        };
      }),
    };
  });
}

// 军事理论只随机挑视频刷时长；国家安全教育优先未看完的章节，全部看完后随机
async function chooseChapter(page, course, opts = {}) {
  const snap = await chapterList(page).catch(() => null);
  if (!snap || !snap.list.length) return { ok: false, label: "未知章节", reason: "未找到章节列表" };
  const tried = opts.tried || new Set();
  const exclude = opts.excludeIdx === undefined ? snap.current : opts.excludeIdx;
  let pending = [];
  if (course.videoStrategy !== "random") {
    pending = snap.list.filter((c) => !c.done && !tried.has(c.i));
    if (!pending.length) pending = snap.list.filter((c) => !c.done);
  }

  let pick;
  let reason;
  if (pending.length) {
    pick = pending[0];
    reason = "优先未看完";
  } else {
    const pool = snap.list.filter((c) => c.i !== exclude);
    pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : snap.list[0];
    reason = course.videoStrategy === "random" ? "随机刷时长" : "已全部看完，随机刷时长";
  }

  const label = `${pick.no} ${pick.title}`.trim();
  for (let attempt = 0; attempt < 2; attempt++) {
    await safeClick(page, `loc=css:li.clearfix.video >> nth=${pick.i}`, "选择视频");
    for (let w = 0; w < 8; w++) {
      await sleep(1500);
      const now = await chapterList(page).catch(() => null);
      if (now && now.current === pick.i) {
        log(`选择视频：${label}（${reason}）`);
        return { ok: true, index: pick.i, label, reason };
      }
    }
  }
  return { ok: false, index: pick.i, label, reason };
}

async function studyCourse(page, course, dayState, persist) {
  log(`开始学习：${course.name}`);
  await page.goto(studyUrl(course), { timeout: 90000 });
  await sleep(6000);
  if (await isLoginPage(page)) throw new Error(`${course.name} 登录已失效，请先手动登录智慧树`);
  try {
    await page.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
  } catch {}
  await dismissStudyPopups(page);
  await page.waitForSelector("loc=css:video", { state: "visible", timeout: 40000 });

  const already = dayState.studySeconds || 0;
  if (already >= STUDY_SECONDS - 5) {
    status.courses[course.key].state = "done";
    status.courses[course.key].studySeconds = already;
    await writeStatus({ step: `${course.name} 今天学习时长已达标，跳过`, courses: status.courses });
    log(`${course.name} 今天学习时长已达标（${already} 秒），跳过`);
    return;
  }
  status.courses[course.key].state = "learning";
  await writeStatus({ currentCourse: course.key, stage: "video", step: `正在打开 ${course.name} 视频页`, courses: status.courses });
  const tried = new Set();
  const first = await chooseChapter(page, course, { tried });
  if (first.ok) {
    await writeStatus({ step: `正在切换视频 · ${course.name} · ${first.label}` });
    await sleep(3000);
  } else {
    log(`未能切换视频（${first.reason}），按当前视频继续`);
  }
  let played = 0;
  let lastT = null;
  let lastLog = -120;
  let quizFails = 0;
  let chapterPlayed = 0;
  let endSeeks = 0;
  const hardDeadline = Date.now() + (STUDY_SECONDS - already + 900) * 1000;

  while (already + played < STUDY_SECONDS - 2) {
    if (Date.now() > hardDeadline) throw new Error(`${course.name} 学习超时，已播放 ${Math.round(played)} 秒`);
    if (await stopRequested()) {
      dayState.studySeconds = Math.round(already + played);
      status.courses[course.key].studySeconds = Math.round(already + played);
      if (persist) await persist();
      try {
        await page.evaluate(() => {
          const v = document.querySelector("video");
          if (v) v.pause();
        });
      } catch {}
      log(`${course.name} 收到停止指令，已保存学习进度 ${Math.round(already + played)} 秒`);
      throw new StopRequested();
    }
    const s = await videoState(page);
    if (!s) {
      await sleep(3000);
      continue;
    }
    if (s.quiz) {
      quizFails++;
      log("出现弹题，随机作答");
      await writeStatus({ step: `正在作答弹题 · ${course.name}` });
      const closed = await closeQuiz(page);
      if (!closed) {
        log("弹题未能关闭");
        if (quizFails >= 3) {
          log("多次未能关闭弹题，重新进入视频页");
          await page.goto(studyUrl(course), { timeout: 90000 });
          await sleep(6000);
          await dismissStudyPopups(page);
          await chooseChapter(page, course, { tried });
          quizFails = 0;
          chapterPlayed = 0;
          endSeeks = 0;
        }
      } else {
        quizFails = 0;
      }
      lastT = null;
      continue;
    }
    status.courses[course.key].studySeconds = Math.round(already + played);
    await writeStatus({
      step: `正在播放视频 · ${course.name}${s.chapter ? " · " + s.chapter : ""}`,
      courses: status.courses,
    });
    if (s.paused) {
      if (s.d > 5 && s.t >= s.d - 1.5) {
        if (chapterPlayed < 5 && endSeeks < 3) {
          endSeeks++;
          log("视频停在结尾，从头开始播放");
          await page.evaluate(() => {
            const v = document.querySelector("video");
            if (v) v.currentTime = 0;
          });
          await sleep(1200);
          await page.mouse.click(430, 380, { label: "点击播放" });
          await sleep(3000);
          chapterPlayed = 0;
          lastT = null;
          continue;
        }
        const snap = await chapterList(page).catch(() => null);
        const cur = snap ? snap.current : -1;
        if (cur >= 0) tried.add(cur);
        log("本章已播完，换一个视频");
        await writeStatus({ step: `正在切换视频 · ${course.name}` });
        const picked = await chooseChapter(page, course, { excludeIdx: cur, tried });
        if (picked.ok) {
          chapterPlayed = 0;
          endSeeks = 0;
          lastT = null;
          await sleep(2000);
          continue;
        }
        log("切换视频失败，本章从头重播");
        await page.evaluate(() => {
          const v = document.querySelector("video");
          if (v) v.currentTime = 0;
        });
        await sleep(1200);
        await page.mouse.click(430, 380, { label: "点击播放" });
        await sleep(4000);
        chapterPlayed = 0;
        endSeeks = 0;
        lastT = null;
        continue;
      }
      await page.mouse.click(430, 380, { label: "点击播放" });
      await sleep(3000);
      const s2 = await videoState(page);
      if (s2 && s2.paused && !s2.quiz) {
        log("视频仍暂停，再次尝试");
        await page.mouse.click(430, 380, { label: "点击播放" });
        await sleep(3000);
      }
      lastT = null;
      continue;
    }
    if (lastT !== null) {
      const delta = s.t - lastT;
      if (delta > 0 && delta < 15) {
        played += delta;
        chapterPlayed += delta;
      }
    }
    lastT = s.t;
    if (already + played - lastLog >= 120) {
      lastLog = already + played;
      dayState.studySeconds = Math.round(already + played);
      if (persist) await persist();
      log(`学习进度 ${Math.round(already + played)}/${STUDY_SECONDS} 秒（视频 ${Math.round(s.t)}/${Math.round(s.d)}）`);
    }
    await sleep(5000);
  }

  dayState.studySeconds = Math.round(already + played);
  status.courses[course.key].state = "done";
  status.courses[course.key].studySeconds = Math.round(already + played);
  await writeStatus({ step: `${course.name} 学习完成（${Math.round(already + played)} 秒）`, courses: status.courses });
  log(`${course.name} 学习完成，累计播放 ${Math.round(already + played)} 秒`);
}

async function openQaHome(page, course) {
  await page.goto(qaUrl(course), { timeout: 90000 });
  await page.reload({ timeout: 90000 });
  await sleep(3500);
  if (await isLoginPage(page)) throw new Error(`${course.name} 问答页登录已失效，请先手动登录智慧树`);
  try {
    await page.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
  } catch {}
  for (let i = 0; i < 3; i++) {
    if (await hasText(page, "下次再说")) {
      await safeClick(page, 'text="下次再说"', "关闭规则引导");
      await sleep(1200);
      continue;
    }
    break;
  }
  await page.keyboard.press("Escape");
  await sleep(600);
  await safeClick(page, 'text="热门"', "查看热门");
  await sleep(1000);
  await safeClick(page, 'text="最新"', "切换到最新");
  await sleep(3500);
  log(`已打开 ${course.name} 问答首页`);
}

async function extractQuestions(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("li.question-item")]
      .map((li) => {
        const span = li.querySelector(".question-content span");
        const author = li.querySelector(".user-name");
        const ans = li.querySelector(".qb-answers");
        return {
          title: span ? (span.getAttribute("title") || span.textContent || "").trim() : "",
          author: author ? author.textContent.trim() : "",
          answers: ans ? parseInt(ans.textContent.replace(/[^0-9]/g, ""), 10) || 0 : 0,
        };
      })
      .filter((x) => x.title),
  );
}

async function postQuestion(page, text) {
  const box = 'loc=css:textarea[placeholder="写下你的问题，以问号结尾"]';
  if (!(await page.evaluate(() => !!document.querySelector('textarea[placeholder="写下你的问题，以问号结尾"]')))) {
    if (!(await safeClick(page, "loc=css:.ask-btn", "打开提问弹窗"))) {
      throw new Error("未找到提问按钮");
    }
    await sleep(2500);
  }
  await page.waitForSelector(box, { state: "visible", timeout: 15000 });
  await page.fill(box, text);
  await sleep(700);
  await page.click('text="立即发布"', { label: "发布提问" });
  await sleep(6000);
  return page.evaluate((t) => document.body.innerText.includes(t.slice(0, 10)), text);
}

async function postAnswer(detail, text) {
  const openDialog = () =>
    detail.evaluate(() => {
      const root = document.querySelector("#app") || document.body.firstElementChild;
      if (!root || !root.__vue__) return "no-root";
      let vm = null;
      const seen = new Set();
      const walk = (n, d) => {
        if (!n || seen.has(n) || d > 18) return;
        seen.add(n);
        const ms = (n.$options && n.$options.methods) || {};
        if (ms.answerPopShow) vm = n;
        for (const c of n.$children || []) walk(c, d + 1);
      };
      walk(root.__vue__, 0);
      if (!vm) return "no-method";
      if (!vm.myAnswerBtnShow) return "btn-hidden";
      vm.answerPopShow();
      return "opened";
    });

  try {
    await detail.waitForLoadState("domcontentloaded", { timeout: 20000 });
  } catch {}

  let stateRes = "";
  for (let i = 0; i < 20; i++) {
    try {
      stateRes = await openDialog();
    } catch {
      stateRes = "eval-error";
    }
    if (stateRes === "opened") break;
    if (stateRes === "btn-hidden") break;
    await sleep(1500);
  }
  if (stateRes !== "opened") {
    const u = await detail.url().catch(() => "?");
    throw new Error(`无法打开回答弹窗（${stateRes}，${String(u).slice(0, 80)}）`);
  }

  const box = 'loc=css:textarea[placeholder="请输入您的回答"]';
  await detail.waitForSelector(box, { state: "visible", timeout: 15000 });
  await detail.fill(box, text);
  await sleep(700);
  await detail.click('text="立即发布"', { label: "发布回答" });
  await sleep(6000);
  const ok = await detail.evaluate(
    (needle) => document.body.innerText.replace(/\s+/g, "").includes(needle),
    text.slice(0, 15).replace(/\s+/g, ""),
  );
  return ok;
}

async function openDetailPage(task, home, title) {
  const before = new Set((await task.tabs()).map((t) => t.targetId));
  const popupPromise = home.waitForEvent("popup", { timeout: 20000 }).catch(() => null);
  let clicked = await safeClick(home, `text="${title}"`, "打开问题详情");
  if (!clicked) {
    await home.keyboard.press("Escape");
    await sleep(800);
    clicked = await safeClick(home, `text="${title}"`, "打开问题详情");
  }
  if (!clicked) return null;

  let page = await popupPromise;
  if (!page) {
    const tabs = await task.tabs();
    const fresh = tabs.find((t) => t.url.includes("questionDetail") && !before.has(t.targetId));
    if (fresh) page = fresh.label ? task.page(fresh.label) : await task.adopt(fresh.page);
  }
  if (!page) return null;
  try {
    await page.waitForURL("**/questionDetail/**", { timeout: 20000 });
  } catch {}
  return page;
}

async function answerRound(task, home, course, state, want) {
  state.answered[course.key] = state.answered[course.key] || [];
  const usedAnswers = new Set();
  const skipped = new Set();
  const done = [];

  dayState[course.key] = dayState[course.key] || {};
  for (let attempt = 0; attempt < 8 && done.length < want; attempt++) {
    if (await stopRequested()) throw new StopRequested();
    const items = await extractQuestions(home);
    const candidates = items.filter(
      (x) =>
        x.author !== "朱鑫宇" &&
        !state.answered[course.key].includes(x.title) &&
        !skipped.has(x.title) &&
        x.answers <= 2 &&
        pickAnswer(course.key, x.title, usedAnswers),
    );
    if (!candidates.length) {
      log(`第${attempt + 1}次查找：暂无可回答的问题，刷新列表`);
      await safeClick(home, 'text="热门"', "查看热门");
      await sleep(800);
      await safeClick(home, 'text="最新"', "切换到最新");
      await sleep(3000);
      continue;
    }

    const target = candidates[0];
    const answer = pickAnswer(course.key, target.title, usedAnswers);
    skipped.add(target.title);
    log(`准备回答问题：${target.title}`);
    await writeStatus({ stage: "answer", step: `正在回答问题 · ${target.title.slice(0, 24)}` });
    const detail = await openDetailPage(task, home, target.title);
    if (!detail) {
      log("问题详情页未打开，跳过");
      if (attempt === 0) await sleep(2000);
      continue;
    }

    try {
      const ok = await postAnswer(detail, answer);
      if (ok) {
        usedAnswers.add(answer);
        done.push(target.title);
        state.answered[course.key].push(target.title);
        if (state.answered[course.key].length > 300) state.answered[course.key] = state.answered[course.key].slice(-300);
        status.courses[course.key].answers = (status.courses[course.key].answers || 0) + 1;
        dayState[course.key].answers = (dayState[course.key].answers || []).concat(target.title);
        await saveState(state);
        await writeStatus({ step: `回答成功 · ${course.name}（${status.courses[course.key].answers}/3）`, courses: status.courses });
        log(`回答成功：${target.title}`);
      } else {
        log(`回答结果未确认：${target.title}`);
      }
    } catch (e) {
      log(`回答失败：${e.message}`);
    } finally {
      try {
        await detail.close();
      } catch {}
    }
  }
  return done;
}

async function acquireTask() {
  const base = "zhidao-daily";
  let lastErr;
  for (let i = 0; i < 4; i++) {
    const name = i === 0 ? base : `${base}-${i}`;
    try {
      return await taskSpace(name);
    } catch (e) {
      lastErr = e;
      log(`浏览器工作区 ${name} 不可用，换一个`);
    }
  }
  throw lastErr;
}

async function pickPages(task) {
  const tabs = (await task.tabs()).filter((t) => t.label);
  const isBlank = (t) => !t.url || /^(chrome:\/\/newtab|about:blank)/.test(t.url);
  const studyTab = tabs.find((t) => (t.url || "").includes("studyvideoh5"));
  const qaTab = tabs.find((t) => (t.url || "").includes("qah5"));
  const blanks = tabs.filter((t) => isBlank(t) && t !== studyTab && t !== qaTab);

  const studyPage = studyTab ? task.page(studyTab.label) : blanks[0] ? task.page(blanks.shift().label) : await task.newPage();
  const qaPage = qaTab ? task.page(qaTab.label) : blanks[0] ? task.page(blanks.shift().label) : await task.newPage();

  for (const t of blanks) {
    if (isBlank(t)) await task.page(t.label).close().catch(() => {});
  }
  return { studyPage, qaPage };
}

let state;
let dayState;

async function main() {
  log(`=== ${DAY} 智慧树自动学习开始 ===`);
  state = await loadState();
  state.days = state.days || {};
  state.asked = state.asked || {};
  state.answered = state.answered || {};
  dayState = state.days[DAY] = state.days[DAY] || {};

  for (const key of Object.keys(status.courses)) {
    const d = dayState[key] || {};
    status.courses[key].studySeconds = d.studySeconds || 0;
    status.courses[key].question = d.question || null;
    status.courses[key].answers = (d.answers || []).length;
    status.courses[key].state = (d.studySeconds || 0) >= STUDY_SECONDS - 5 ? "done" : "idle";
  }
  await writeStatus({
    running: true,
    startedAt: new Date().toISOString(),
    stage: "start",
    step: "准备开始今日任务",
    courses: status.courses,
  });

  const task = await acquireTask();
  const { studyPage, qaPage } = await pickPages(task);

  for (const key of ["military", "security"]) {
    const course = COURSES[key];
    dayState[key] = dayState[key] || {};
    await ensureRunning();
    if ((dayState[key].studySeconds || 0) >= STUDY_SECONDS - 5) {
      log(`${course.name} 今天已完成学习，跳过`);
      continue;
    }
    try {
      await studyCourse(studyPage, course, dayState[key], () => saveState(state));
    } catch (e) {
      if (e instanceof StopRequested) throw e;
      errors.push(`${course.name} 学习失败：${e.message}`);
      status.courses[key].state = "error";
      await writeStatus({ step: `${course.name} 学习失败：${e.message}`, courses: status.courses });
      log(errors[errors.length - 1]);
    }
    await saveState(state);
  }

  for (const key of ["military", "security"]) {
    const course = COURSES[key];
    dayState[key] = dayState[key] || {};
    await ensureRunning();
    try {
      await writeStatus({ stage: "qa", step: `正在检查问答任务 · ${course.name}`, currentCourse: key, courses: status.courses });
      await openQaHome(qaPage, course);
      if (!dayState[key].question) {
        await writeStatus({ stage: "ask", step: `正在发布提问 · ${course.name}` });
        const q = pickQuestion(key, state);
        const ok = await postQuestion(qaPage, q);
        if (!ok) throw new Error("提问结果未确认");
        state.asked[key] = state.asked[key] || [];
        state.asked[key].push(q);
        dayState[key].question = q;
        status.courses[key].question = q;
        await saveState(state);
        log(`提问成功：${q}`);
      } else {
        status.courses[key].question = dayState[key].question;
        log(`今天已提问，跳过：${dayState[key].question}`);
      }

      await openQaHome(qaPage, course);
      const answeredToday = (dayState[key].answers || []).length;
      if (answeredToday >= 3) {
        log(`${course.name} 今天已回答 ${answeredToday} 条，跳过回答`);
      } else {
        const done = await answerRound(task, qaPage, course, state, 3 - answeredToday);
        if (done.length < 3) log(`${course.name} 今天新增回答 ${done.length} 条`);
      }
    } catch (e) {
      if (e instanceof StopRequested) throw e;
      errors.push(`${course.name} 问答失败：${e.message}`);
      await writeStatus({ step: `${course.name} 问答失败：${e.message}` });
      log(errors[errors.length - 1]);
    }
    await saveState(state);
  }

  dayState.updatedAt = new Date().toISOString();
  await saveState(state);
  await writeStatus({
    running: false,
    stage: errors.length ? "error" : "done",
    step: errors.length ? `任务结束，有 ${errors.length} 个错误，请查看日志` : "今日任务已全部完成",
    courses: status.courses,
  });
  log(`=== 结束，错误 ${errors.length} 个 ===`);
}

try {
  await main();
} catch (e) {
  if (e instanceof StopRequested) {
    log("收到停止指令，任务已停止");
    await writeStatus({ running: false, stage: "stopped", step: "任务已手动停止", courses: status.courses });
  } else {
    errors.push(e.message);
    log(`脚本异常：${e.message}`);
    await writeStatus({ running: false, stage: "error", step: `脚本异常：${e.message}` });
  }
}

await flushLog();
process.exitCode = errors.length ? 1 : 0;

