(()=>{
 const root=document.getElementById('ti'),buttons=[...root.querySelectorAll('.infra-node')],out=root.querySelector('.infra-readout');
 const checks={host:['Onde os sistemas rodam','Responsáveis e acessos','Custos e capacidade'],dns:['Registro e renovação','Apontamentos do domínio','Dependências dos serviços'],mail:['Contas e responsáveis','Autenticação do domínio','Encaminhamentos e acessos'],integra:['Sistemas conectados','Dependências e credenciais','Impacto de uma mudança'],backup:['Rotina e retenção','Teste de restauração','Plano de continuidade'],monitor:['Disponibilidade e certificados','Erros e alertas','Responsável pela resposta']};
 const extra=document.createElement('div');extra.className='control-checklist';out.append(extra);
 function update(){const current=buttons.find(b=>b.getAttribute('aria-selected')==='true')||buttons[0];const key=current.dataset.node;
  extra.replaceChildren();const label=document.createElement('small');label.textContent='O que avaliamos';extra.append(label);const list=document.createElement('ul');for(const text of checks[key]){const item=document.createElement('li');item.textContent=text;list.append(item);}extra.append(list);
  root.querySelector('.infra').dataset.selected=key;
 }
 const sizeOrbit=()=>root.querySelector('.control-orbit ellipse').setAttribute('rx',innerWidth<=600?'221.7':'190');
 addEventListener('resize',sizeOrbit,{passive:true});sizeOrbit();
 new MutationObserver(update).observe(root.querySelector('.infra'),{subtree:true,attributes:true,attributeFilter:['aria-selected']});update();
})();
