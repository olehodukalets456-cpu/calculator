const f = (id, label, help, type='number', required=true) => ({id,label,help,type,required});

const VERTICALS = {
  ecom: {
    title: 'ecomTitle', desc: 'ecomDesc', basis: true, defaultBasis: 'first',
    money: [f('aov','aov','aovHelp','money'), f('customerLtv','customerLtv','customerLtvHelp','money'), f('margin','margin','marginHelp','percent'), f('fixedCosts','fixedCosts','fixedCostsHelp','money',false)],
    defaults: {adSpend:'',cpc:'',aov:'',customerLtv:'',margin:'',fixedCosts:''},
    stages: [{nameUk:'Покупка',nameEn:'Purchase',rate:''}]
  },
  leadgen: {
    title: 'leadgenTitle', desc: 'leadgenDesc', basis: false, defaultBasis: 'first',
    money: [f('valuePerSale','valuePerSale','valuePerSaleHelp','money'), f('margin','margin','marginHelp','percent'), f('fixedCosts','fixedCosts','fixedCostsHelp','money',false)],
    defaults: {adSpend:'',cpc:'',valuePerSale:'',margin:'',fixedCosts:''},
    stages: [{nameUk:'Лід',nameEn:'Lead',rate:''},{nameUk:'Кваліфікований лід',nameEn:'Qualified lead',rate:''},{nameUk:'Продаж',nameEn:'Sale',rate:''}]
  },
  edtech: {
    title: 'edtechTitle', desc: 'edtechDesc', basis: false, defaultBasis: 'first',
    money: [f('studentValue','studentValue','studentValueHelp','money'), f('margin','margin','marginHelp','percent'), f('fixedCosts','fixedCosts','fixedCostsHelp','money',false)],
    defaults: {adSpend:'',cpc:'',studentValue:'',margin:'',fixedCosts:''},
    stages: [{nameUk:'Лід',nameEn:'Lead',rate:''},{nameUk:'Дзвінок / анкета',nameEn:'Call / application',rate:''},{nameUk:'Оплата',nameEn:'Payment',rate:''}]
  },
  saas: {
    title: 'saasTitle', desc: 'saasDesc', basis: true, defaultBasis: 'ltv',
    money: [f('monthlyArpu','monthlyArpu','monthlyArpuHelp','money'), f('lifetimeMonths','lifetimeMonths','lifetimeMonthsHelp','number'), f('margin','margin','marginHelp','percent'), f('fixedCosts','fixedCosts','fixedCostsHelp','money',false)],
    defaults: {adSpend:'',cpc:'',monthlyArpu:'',lifetimeMonths:'',margin:'',fixedCosts:''},
    stages: [{nameUk:'Signup / trial',nameEn:'Signup / trial',rate:''},{nameUk:'Paid-клієнт',nameEn:'Paid customer',rate:''}]
  },
  brand: {
    title: 'brandTitle', desc: 'brandDesc', basis: false, defaultBasis: 'first',
    money: [
      f('brandResultValue','brandResultValue','brandResultValueHelp','money',false),
      f('brandTargetCost','brandTargetCost','brandTargetCostHelp','money',false),
      f('activeRate','activeRate','activeRateHelp','percent',false),
      f('fixedCosts','fixedCosts','fixedCostsHelp','money',false)
    ],
    defaults: {adSpend:'',cpc:'',brandResultValue:'',brandTargetCost:'',activeRate:'',fixedCosts:''},
    stages: [
      {nameUk:'Перехід у профіль / канал',nameEn:'Profile / channel visit',rate:''},
      {nameUk:'Підписка / цільова дія',nameEn:'Follow / meaningful action',rate:''}
    ]
  }
};

