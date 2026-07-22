'use strict';
ensureState();
dom.reset.onclick=()=>{
  const cfg=VERTICALS[state.vertical];
  state.values[state.vertical]={...cfg.defaults};
  state.basis[state.vertical]=cfg.defaultBasis;
  state.trafficMode[state.vertical]='cpc';
  state.stages[state.vertical]=cloneStages(cfg.stages);
  renderAll();save();
};
renderAll();
