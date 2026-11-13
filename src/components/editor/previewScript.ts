// Injected into the preview iframe only (never saved). Lets the user hover and
// click a data-section element to target edits at it, and blocks link navigation.
const SCRIPT = `<script data-dd-editor>(function(){
var on=false;
var st=document.createElement('style');
st.textContent='[data-dd-hover]{outline:2px dashed #ff5c9d!important;outline-offset:-3px;cursor:pointer!important}[data-dd-selected]{outline:3px solid #6d82ff!important;outline-offset:-3px}[data-dd-label]{position:absolute;z-index:2147483647;background:#ff5c9d;color:#fff;font:600 11px/1 system-ui;padding:4px 6px;border-radius:4px;pointer-events:none}';
document.head&&document.head.appendChild(st);
var label=document.createElement('div');label.setAttribute('data-dd-label','');label.style.display='none';
function clear(attr){document.querySelectorAll('['+attr+']').forEach(function(x){x.removeAttribute(attr)})}
window.addEventListener('message',function(e){var d=e.data||{};
 if(d.dd==='select-mode'){on=!!d.on;if(!on){clear('data-dd-hover');label.style.display='none'}}
 if(d.dd==='selected'){clear('data-dd-selected');if(d.name){var el=document.querySelector('[data-section="'+d.name+'"]');if(el){el.setAttribute('data-dd-selected','');if(d.scroll)el.scrollIntoView({behavior:'smooth',block:'start'})}}}
});
document.addEventListener('mouseover',function(e){if(!on)return;var s=e.target.closest&&e.target.closest('[data-section]');clear('data-dd-hover');
 if(s){s.setAttribute('data-dd-hover','');if(!label.parentNode)document.body.appendChild(label);var r=s.getBoundingClientRect();label.textContent=s.getAttribute('data-section');label.style.display='block';label.style.top=(r.top+window.scrollY+6)+'px';label.style.left=(r.left+window.scrollX+6)+'px'}});
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a');if(a)e.preventDefault();if(!on)return;e.preventDefault();e.stopPropagation();
 var s=e.target.closest&&e.target.closest('[data-section]');if(s)parent.postMessage({dd:'section',name:s.getAttribute('data-section')},'*')},true);
var secs=[];document.querySelectorAll('[data-section]').forEach(function(x){secs.push(x.getAttribute('data-section'))});
parent.postMessage({dd:'sections',list:secs},'*');
})();</script>`;

export function withEditorScript(html: string) {
  if (!html) return html;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${SCRIPT}</body>`);
  return html + SCRIPT;
}
