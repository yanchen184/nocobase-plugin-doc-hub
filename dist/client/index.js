/**
 * DocHub Plugin - Client
 */
!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t(require("@nocobase/client"),require("react"),require("antd"),require("@ant-design/icons"),require("react-router-dom")):"function"==typeof define&&define.amd?define("@nocobase/plugin-doc-hub",["@nocobase/client","react","antd","@ant-design/icons","react-router-dom"],t):"object"==typeof exports?exports["@nocobase/plugin-doc-hub"]=t(require("@nocobase/client"),require("react"),require("antd"),require("@ant-design/icons"),require("react-router-dom")):e["@nocobase/plugin-doc-hub"]=t(e["@nocobase/client"],e.react,e.antd,e["@ant-design/icons"],e["react-router-dom"])}(self,function(ncDep,reactDep,antdDep,iconsDep,rrDep){return function(){"use strict";
var mods={
  772:function(m){m.exports=ncDep},
  156:function(m){m.exports=reactDep},
  450:function(m){m.exports=antdDep},
  300:function(m){m.exports=iconsDep},
  890:function(m){m.exports=rrDep}
};
var cache={};
function req(id){
  var cached=cache[id];
  if(void 0!==cached)return cached.exports;
  var mod=cache[id]={exports:{}};
  mods[id](mod,mod.exports,req);
  return mod.exports;
}
req.d=function(e,t){for(var n in t)req.o(t,n)&&!req.o(e,n)&&Object.defineProperty(e,n,{enumerable:!0,get:t[n]});};
req.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t);};
req.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"});Object.defineProperty(e,"__esModule",{value:!0});};
var exports$={};
return!function(){

req.r(exports$);
req.d(exports$,{default:function(){return DocHubPlugin;}});

var _nc=req(772);
var _React=req(156);
var _antd=req(450);
var _icons=req(300);
var _rr=req(890);

var Plugin=_nc.Plugin;
var useAPIClient=_nc.useAPIClient;
var h=_React.createElement;
var useState=_React.useState;
var useEffect=_React.useEffect;
var useCallback=_React.useCallback;
var useRef=_React.useRef;
var useParams=_rr.useParams;
var useNavigate=_rr.useNavigate;
var useLocation=_rr.useLocation||function(){return {search:window.location.search};};

var Table=_antd.Table,Button=_antd.Button,Input=_antd.Input,Select=_antd.Select,Modal=_antd.Modal,Tag=_antd.Tag,Space=_antd.Space,Spin=_antd.Spin,message=_antd.message,Typography=_antd.Typography,Tooltip=_antd.Tooltip,Badge=_antd.Badge,Row=_antd.Row,Col=_antd.Col,Alert=_antd.Alert,Empty=_antd.Empty,Divider=_antd.Divider,Avatar=_antd.Avatar,Popover=_antd.Popover,Dropdown=_antd.Dropdown,Menu=_antd.Menu,Collapse=_antd.Collapse;
var PlusOutlined=_icons.PlusOutlined,SearchOutlined=_icons.SearchOutlined,HistoryOutlined=_icons.HistoryOutlined,EditOutlined=_icons.EditOutlined,SyncOutlined=_icons.SyncOutlined,ExclamationCircleOutlined=_icons.ExclamationCircleOutlined,FolderOutlined=_icons.FolderOutlined,FileTextOutlined=_icons.FileTextOutlined,ArrowLeftOutlined=_icons.ArrowLeftOutlined,UserOutlined=_icons.UserOutlined,BoldOutlined=_icons.BoldOutlined,ItalicOutlined=_icons.ItalicOutlined,UnderlineOutlined=_icons.UnderlineOutlined,LinkOutlined=_icons.LinkOutlined,CodeOutlined=_icons.CodeOutlined,OrderedListOutlined=_icons.OrderedListOutlined,UnorderedListOutlined=_icons.UnorderedListOutlined,DeleteOutlined=_icons.DeleteOutlined,SwapOutlined=_icons.SwapOutlined,InfoCircleOutlined=_icons.InfoCircleOutlined,PictureOutlined=_icons.PictureOutlined,LoadingOutlined=_icons.LoadingOutlined,LockOutlined=_icons.LockOutlined,SettingOutlined=_icons.SettingOutlined;

// 動態載入 marked.js + DOMPurify（CDN），載入後 window.marked / window.DOMPurify 可用
var _markedLoaded=false;
var _markedCallbacks=[];
function getMarkedParse(){
  var m=window.marked;
  if(!m)return null;
  if(typeof m==='function')return m;
  if(typeof m.parse==='function')return m.parse.bind(m);
  if(typeof m.marked==='function')return m.marked;
  return null;
}
function loadScript(src,cb){
  var s=document.createElement('script');
  s.src=src;
  s.onload=cb;
  s.onerror=cb; // 失敗也繼續，fallback 會處理
  document.head.appendChild(s);
}
function loadMarked(cb){
  if(getMarkedParse()){cb();return;}
  _markedCallbacks.push(cb);
  if(_markedLoaded)return;
  _markedLoaded=true;
  loadScript('/static/plugins/@nocobase/plugin-doc-hub/dist/client/marked.min.js',function(){
    try{
      var m=window.marked;
      if(m&&m.setOptions)m.setOptions({breaks:true,gfm:true});
      else if(m&&m.use)m.use({breaks:true,gfm:true});
    }catch(e){}
    // 載入 DOMPurify 後再回呼
    if(window.DOMPurify){
      _markedCallbacks.forEach(function(fn){fn();});
      _markedCallbacks=[];
    } else {
      loadScript('https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js',function(){
        _markedCallbacks.forEach(function(fn){fn();});
        _markedCallbacks=[];
      });
    }
  });
}
function sanitizeHtml(html){
  if(window.DOMPurify&&window.DOMPurify.sanitize){
    return window.DOMPurify.sanitize(html,{
      USE_PROFILES:{html:true},
      ADD_TAGS:['iframe'],
      ADD_ATTR:['allow','allowfullscreen','frameborder','target','rel'],
    });
  }
  // fallback：沒有 DOMPurify 時純文字顯示
  return html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+on\w+\s*=/gi,'');
}

// 把 DocHub 自訂語法預處理成 HTML，再交給 marked
//   !pdf[檔名](url)                 → <iframe> 內嵌 PDF
//   [📎 檔名](url)、[檔名.docx](url) → 加上檔案 icon + 樣式（非圖片連結）
function preprocessDochubSyntax(md){
  if(!md)return'';
  // 1) PDF 內嵌
  md=md.replace(/(^|\n)!pdf\[([^\]]*)\]\(([^\s)]+)\)/g,function(_,lead,name,url){
    var safeName=String(name||'附件').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return lead+
      '<div class="dochub-pdf-embed" style="margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#f8fafc;">'+
        '<div style="padding:8px 12px;border-bottom:1px solid #e2e8f0;background:#fff;display:flex;align-items:center;gap:8px;font-size:13px;color:#334155;">'+
          '<span>📄</span>'+
          '<span style="font-weight:500;">'+safeName+'</span>'+
          '<a href="'+url+'" target="_blank" rel="noopener" style="margin-left:auto;color:#2563eb;font-size:12px;text-decoration:none;">下載 ↗</a>'+
        '</div>'+
        '<iframe src="'+url+'#toolbar=1" style="width:100%;height:600px;border:0;display:block;background:#fff;"></iframe>'+
      '</div>';
  });
  return md;
}

// 把附件連結（非圖片）渲染成好看的卡片樣式
function enhanceAttachmentLinks(html){
  if(!html)return'';
  var attachExt=/\.(pdf|docx?|xlsx?|pptx?|csv|txt|zip|rar|7z|md)$/i;
  return html.replace(
    /<a\s+([^>]*?)href="([^"]+)"([^>]*)>([^<]+)<\/a>/gi,
    function(match,pre,url,post,text){
      if(!attachExt.test(url))return match;
      var extMatch=url.toLowerCase().match(/\.([a-z0-9]+)(?:\?|#|$)/);
      var ext=extMatch?extMatch[1]:'';
      var icon='📎';
      if(ext==='pdf')icon='📄';
      else if(ext==='docx'||ext==='doc')icon='📝';
      else if(ext==='xlsx'||ext==='xls'||ext==='csv')icon='📊';
      else if(ext==='pptx'||ext==='ppt')icon='📊';
      else if(ext==='zip'||ext==='rar'||ext==='7z')icon='🗜️';
      // 避免把已經有 emoji 的文字再加一次
      var cleanText=text.replace(/^[📎📄📝📊🗜️]\s*/,'');
      var style='display:inline-flex;align-items:center;gap:6px;padding:4px 10px;margin:2px;'
        +'background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;'
        +'color:#2563eb;text-decoration:none;font-size:13px;';
      return '<a '+pre+'href="'+url+'"'+post+' target="_blank" rel="noopener" style="'+style+'">'
        +'<span>'+icon+'</span><span>'+cleanText+'</span></a>';
    }
  );
}

function renderMarkdown(md){
  if(!md)return'';
  var parse=getMarkedParse();
  if(parse){
    var html=parse(preprocessDochubSyntax(md));
    return enhanceAttachmentLinks(sanitizeHtml(html));
  }
  // fallback
  return md.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br/>');
}

function useDocList(qSearch,qCategoryId,qStatus,qProjectId,qTags){
  var client=useAPIClient();
  var _d=useState([]);var data=_d[0];var setData=_d[1];
  var _l=useState(true);var loading=_l[0];var setLoading=_l[1];
  var tagsKey=(qTags||[]).slice().sort().join(',');
  var reload=useCallback(function(){
    if(!client)return;
    setLoading(true);
    var useSearch=!!qSearch;
    var url=useSearch?'docDocuments:search':'docDocuments:list';
    var params={pageSize:200,sort:useSearch?['-updatedAt']:['sort','-updatedAt'],appends:['category','lastEditor','tags']};
    if(useSearch){
      params.q=qSearch;
      if(qCategoryId)params.categoryId=qCategoryId;
      if(qStatus&&qStatus!=='all')params.status=qStatus;
      if(qProjectId)params.projectId=qProjectId;
      if(!qCategoryId&&qProjectId)params.requireCategory=1;
      if(qTags&&qTags.length)params.tags=qTags.join(',');
    } else {
      var filter={};
      if(qCategoryId){
        filter.categoryId=qCategoryId;
      } else if(qProjectId) {
        // 只選專案未選資料夾時，只顯示有 categoryId 的文件（排除未分組）
        filter.categoryId={'$notNull':true};
      }
      if(qStatus&&qStatus!=='all')filter.status=qStatus;
      if(qProjectId)filter.projectId=qProjectId;
      if(qTags&&qTags.length)filter.tags=qTags.join(',');
      if(Object.keys(filter).length)params.filter=filter;
    }
    client.request({url:url,method:'get',params:params})
      .then(function(res){
        var d=res.data&&res.data.data;
        setData(Array.isArray(d)?d:[]);
        setLoading(false);
      })
      .catch(function(){setLoading(false);});
  },[client,qSearch,qCategoryId,qStatus,qProjectId,tagsKey]);
  useEffect(function(){reload();},[reload]);
  return {data:data,loading:loading,reload:reload};
}

function useCurrentUser(){
  var client=useAPIClient();
  var _u=useState(null);var user=_u[0];var setUser=_u[1];
  useEffect(function(){
    if(!client)return;
    client.request({url:'auth:check',method:'get'})
      .then(function(res){setUser(res.data&&res.data.data);})
      .catch(function(){});
  },[client]);
  return user;
}

function useDoc(id){
  var client=useAPIClient();
  var _d=useState(null);var doc=_d[0];var setDoc=_d[1];
  var _l=useState(!!id&&id!=='new');var loading=_l[0];var setLoading=_l[1];
  useEffect(function(){
    if(!id||id==='new'||!client)return;
    setLoading(true);
    client.request({url:'docDocuments:get',method:'get',params:{filterByTk:id,appends:['viewers','editors','subscribers','type','lastEditor','tags','project','project.viewers','project.editors','project.subscribers']}})
      .then(function(res){var d=res.data&&res.data.data;if(d)setDoc(d);setLoading(false);})
      .catch(function(){setLoading(false);});
  },[id,client]);
  return {doc:doc,loading:loading};
}

function syncBadge(s,rec){
  var statusNode=s==='synced'?h(Badge,{status:'success',text:'Synced'}):s==='failed'?h(Badge,{status:'error',text:'Failed'}):h(Badge,{status:'default',text:'Pending'});
  if(s==='synced'&&rec&&rec.gitLastSyncedByName){
    var syncedAt=rec.gitSyncedAt?new Date(rec.gitSyncedAt).toLocaleString('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'-';
    var tipContent=h('div',null,h('div',null,'同步者：'+rec.gitLastSyncedByName),h('div',null,'時間：'+syncedAt));
    return h(Tooltip,{title:tipContent},statusNode);
  }
  return statusNode;
}

function GitSyncModal(props){
  var visible=props.visible,onCancel=props.onCancel,onConfirm=props.onConfirm,doc=props.doc||{},syncing=props.syncing;
  var fp='docs/'+(doc.slug||'untitled')+'.md';
  var lines=['--- a/'+fp,'+++ b/'+fp,'@@ -0,0 +1 @@','+# '+(doc.title||'Document')];
  return h(Modal,{title:h('span',null,h(ExclamationCircleOutlined,{style:{color:'#faad14',marginRight:8}}),'Git Sync Confirmation'),open:visible,onCancel:onCancel,width:680,footer:h(Space,null,h(Button,{onClick:onCancel},'Cancel'),h(Button,{type:'primary',danger:true,loading:syncing,icon:h(SyncOutlined),onClick:onConfirm},'Confirm Push'))},
    h(Alert,{message:'This operation is irreversible.',type:'warning',showIcon:true,style:{marginBottom:16}}),
    h('div',{style:{background:'#1e1e1e',borderRadius:6,padding:16,fontFamily:'monospace',fontSize:12,maxHeight:220,overflow:'auto'}},
      lines.map(function(line,i){
        var color=line.startsWith('+')&&!line.startsWith('+++')?'#4caf50':line.startsWith('-')&&!line.startsWith('---')?'#f44336':line.startsWith('@@')?'#64b5f6':'#ccc';
        return h('div',{key:i,style:{color:color}},line);
      })
    )
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
function DocSidebar(props){
  var activeCatId=props.activeCatId,onSelectCat=props.onSelectCat;
  var activeProjectId=props.activeProjectId,onSelectProject=props.onSelectProject;
  var search=props.search,onSearch=props.onSearch;
  var onOpenAuditLog=props.onOpenAuditLog;
  var client=useAPIClient();
  var navigate=useNavigate();
  // 注入全域 sidebar CSS
  useEffect(function(){
    var id='dochub-sidebar-style';
    if(document.getElementById(id))return;
    var st=document.createElement('style');
    st.id=id;
    st.textContent=[
      '[class*="dochub-cat-row"]:hover .dochub-cat-actions, .dochub-cat-row-active .dochub-cat-actions{opacity:1!important}',
      '.dochub-cat-actions{transition:opacity 0.15s}'
    ].join('');
    document.head.appendChild(st);
  },[]);
  var currentUser=useCurrentUser();
  var _col=useState(false);var collapsed=_col[0];var setCollapsed=_col[1];
  var _g=useState([]);var groups=_g[0];var setGroups=_g[1];
  var _p=useState([]);var projects=_p[0];var setProjects=_p[1];
  var _c=useState([]);var cats=_c[0];var setCats=_c[1];
  var _exp=useState({});var expanded=_exp[0];var setExpanded=_exp[1];
  var _gexp=useState({});var groupExpanded=_gexp[0];var setGroupExpanded=_gexp[1];
  var _docCount=useState({});var docCount=_docCount[0];var setDocCount=_docCount[1];

  // Create Group modal
  var _cg=useState(false);var showCreateGroup=_cg[0];var setShowCreateGroup=_cg[1];
  var _cgn=useState('');var newGroupName=_cgn[0];var setNewGroupName=_cgn[1];
  var _cgs=useState(false);var creatingGroup=_cgs[0];var setCreatingGroup=_cgs[1];

  // Create Project modal
  var _cp=useState(null);var createProjGroupId=_cp[0];var setCreateProjGroupId=_cp[1]; // null = hidden, groupId = open
  var _spg=useState(null);var selectedProjGroupId=_spg[0];var setSelectedProjGroupId=_spg[1];
  var _cpn=useState('');var newProjName=_cpn[0];var setNewProjName=_cpn[1];
  var _cpd=useState('');var newProjDesc=_cpd[0];var setNewProjDesc=_cpd[1];
  var _cps=useState(false);var creatingProj=_cps[0];var setCreatingProj=_cps[1];
  // 預設資料夾樹（建立專案時 server 依群組類型自動生成；client 只做預覽）
  var SDLC_PHASES_UI=[
    {name:'01_提案與規劃'},{name:'02_需求'},{name:'03_設計'},
    {name:'04_測試'},{name:'05_部署與上線'},{name:'06_驗收'},{name:'07_結案'}
  ];
  var SDLC_TREE=SDLC_PHASES_UI.concat([
    {name:'99_記錄',children:[
      {name:'變更申請單'},
      {name:'會議紀錄',children:SDLC_PHASES_UI.slice()},
      {name:'審核紀錄'}
    ]}
  ]);
  // 共用群組下的 project 視為頂層分類，不自動建子資料夾
  var KB_TREE=[];

  // Create Category modal
  var _cc=useState(null);var createCatProjId=_cc[0];var setCreateCatProjId=_cc[1]; // null = hidden
  var _ccp=useState(null);var createCatParentId=_ccp[0];var setCreateCatParentId=_ccp[1]; // null = 根節點
  var _ccn=useState('');var newCatName=_ccn[0];var setNewCatName=_ccn[1];
  var _ccd=useState('');var newCatDesc=_ccd[0];var setNewCatDesc=_ccd[1];
  var _ccs=useState(false);var creatingCat=_ccs[0];var setCreatingCat=_ccs[1];

  // Project expanded state（預設展開，false 才收起）
  var _pe=useState({});var expandedProj=_pe[0];var setExpandedProj=_pe[1];

  // Delete Project confirm modal
  var _dp=useState(null);var deleteProj=_dp[0];var setDeleteProj=_dp[1]; // null = hidden, proj obj = open
  var _dps=useState(false);var deletingProj=_dps[0];var setDeletingProj=_dps[1];

  // Delete Category confirm modal
  var _dc=useState(null);var deleteCat=_dc[0];var setDeleteCat=_dc[1];
  var _dcs=useState(false);var deletingCat=_dcs[0];var setDeletingCat=_dcs[1];

  // Rename Category inline
  var _rc=useState(null);var renamingCatId=_rc[0];var setRenamingCatId=_rc[1];
  var _rcn=useState('');var renameCatName=_rcn[0];var setRenameCatName=_rcn[1];

  // Project Permissions Modal
  var _cp2=useState(null);var permProj=_cp2[0];var setPermProj=_cp2[1]; // null=hidden, proj obj=open
  var _cpv=useState([]);var permViewerIds=_cpv[0];var setPermViewerIds=_cpv[1];
  var _cpe=useState([]);var permEditorIds=_cpe[0];var setPermEditorIds=_cpe[1];
  var _cps=useState([]);var permSubscriberIds=_cps[0];var setPermSubscriberIds=_cps[1];
  var _cpld=useState(false);var permLoading=_cpld[0];var setPermLoading=_cpld[1];
  var _cpsv=useState(false);var permSaving=_cpsv[0];var setPermSaving=_cpsv[1];
  var _allusers=useState([]);var allUsers=_allusers[0];var setAllUsers=_allusers[1];

  // 資料夾權限 Modal state
  var _permCat=useState(null);var permCat=_permCat[0];var setPermCat=_permCat[1];
  var _permCatOverride=useState(false);var permCatOverride=_permCatOverride[0];var setPermCatOverride=_permCatOverride[1];
  var _permCatViewerIds=useState([]);var permCatViewerIds=_permCatViewerIds[0];var setPermCatViewerIds=_permCatViewerIds[1];
  var _permCatEditorIds=useState([]);var permCatEditorIds=_permCatEditorIds[0];var setPermCatEditorIds=_permCatEditorIds[1];
  var _permCatLoading=useState(false);var permCatLoading=_permCatLoading[0];var setPermCatLoading=_permCatLoading[1];
  var _permCatSaving=useState(false);var permCatSaving=_permCatSaving[0];var setPermCatSaving=_permCatSaving[1];

  // Drag Category (同層排序)
  var _dcat=useState(null);var dragCatId=_dcat[0];var setDragCatId=_dcat[1];
  var _dov=useState(null);var dragOverCatId=_dov[0];var setDragOverCatId=_dov[1];
  var _dragRef=useRef({timer:null,active:false,catId:null,projId:null,parentId:null});

  var isAdmin=!!(currentUser&&(currentUser.id===1||
    (currentUser.roles&&currentUser.roles.some(function(r){return r.name==='root'||r.name==='admin';}))));

  function loadSidebar(){
    if(!client)return;
    client.request({url:'docGroups:list',method:'get',params:{pageSize:50,sort:['sort']}})
      .then(function(res){setGroups((res.data&&res.data.data)||[]);});
    client.request({url:'docProjects:list',method:'get',params:{pageSize:100}})
      .then(function(res){
        var projs=(res.data&&res.data.data)||[];
        setProjects(projs);
        projs.forEach(function(p){
          client.request({url:'docDocuments:count',method:'get',params:{projectId:p.id}})
            .then(function(r){
              var cnt=(r.data&&r.data.data&&r.data.data.count!=null)?r.data.data.count:0;
              setDocCount(function(prev){var n=Object.assign({},prev);n[p.id]=cnt;return n;});
            }).catch(function(){});
        });
      });
    // 資料夾可能 >200（多專案累積）—分頁遞迴撈完整清單
    (function loadAllCats(page,acc){
      client.request({url:'docCategories:list',method:'get',params:{pageSize:200,page:page,sort:['sort']}})
        .then(function(res){
          var rows=(res.data&&res.data.data)||[];
          var merged=acc.concat(rows);
          var meta=(res.data&&res.data.meta)||{};
          if(meta.totalPage&&page<meta.totalPage){loadAllCats(page+1,merged);}
          else{setCats(merged);}
        });
    })(1,[]);
  }

  useEffect(function(){loadSidebar();},[client]);

  function toggleExpand(id){
    setExpanded(function(e){var n=Object.assign({},e);n[id]=!n[id];return n;});
  }
  function toggleGroupExpand(id){
    setGroupExpanded(function(e){var n=Object.assign({},e);n[id]=e[id]===true?false:true;return n;});
  }

  function doCreateGroup(){
    if(!newGroupName.trim()||!client)return;
    setCreatingGroup(true);
    client.request({url:'docGroups:create',method:'post',data:{name:newGroupName.trim()}})
      .then(function(){message.success('群組建立成功');setShowCreateGroup(false);setNewGroupName('');setCreatingGroup(false);loadSidebar();})
      .catch(function(err){message.error('失敗: '+(err&&err.message||'error'));setCreatingGroup(false);});
  }

  function doCreateProject(){
    if(!newProjName.trim()||!client)return;
    if(!selectedProjGroupId){message.warning('請選擇所屬群組');return;}
    setCreatingProj(true);
    // 不再送 folders：server 會依 SDLC 預設樹自動建立
    client.request({url:'docProjects:create',method:'post',data:{
      name:newProjName.trim(),
      description:newProjDesc.trim()||undefined,
      groupId:selectedProjGroupId
    }})
      .then(function(res){
        console.log('[DocHub] create project FULL response:',JSON.stringify(res));
        message.success('專案建立成功');
        setCreateProjGroupId(null);setSelectedProjGroupId(null);setNewProjName('');setNewProjDesc('');setCreatingProj(false);
        // 兼容多層回傳格式
        var d=res&&res.data;var dd=d&&d.data;
        var created=null;
        if(dd&&typeof dd==='object'){created=Array.isArray(dd)?dd[0]:dd;}
        if(!created&&d&&d.id)created=d;
        var newId=created&&created.id;
        console.log('[DocHub] resolved newId:',newId);
        loadSidebar();
        if(newId){
          // 用 setTimeout 確保 state update 跟 sidebar reload 不衝突
          setTimeout(function(){
            console.log('[DocHub] applying onSelectProject('+newId+')');
            if(typeof onSelectCat==='function')onSelectCat(null);
            if(typeof onSelectProject==='function')onSelectProject(newId);
            try{navigate&&navigate('/admin/doc-hub?projectId='+newId,{replace:true});}catch(e){console.warn('navigate fail',e);}
          },50);
        }else{
          message.warning('建立成功但無法跳轉，請手動點擊新專案');
        }
      })
      .catch(function(err){message.error('失敗: '+(err&&err.message||'error'));setCreatingProj(false);});
  }

  function doCreateCategory(){
    if(!newCatName.trim()||!client)return;
    setCreatingCat(true);
    var payload={name:newCatName.trim(),projectId:createCatProjId};
    if(createCatParentId)payload.parentId=createCatParentId;
    if(newCatDesc.trim())payload.description=newCatDesc.trim();
    client.request({url:'docCategories:create',method:'post',data:payload})
      .then(function(){
        message.success('資料夾建立成功');
        setCreateCatProjId(null);setCreateCatParentId(null);setNewCatName('');setNewCatDesc('');setCreatingCat(false);
        loadSidebar();
      })
      .catch(function(err){message.error('失敗: '+(err&&err.message||'error'));setCreatingCat(false);});
  }

  function doDeleteProject(){
    if(!deleteProj||!client)return;
    setDeletingProj(true);
    client.request({url:'docProjects:destroy',method:'delete',params:{filterByTk:deleteProj.id}})
      .then(function(){message.success('專案已刪除');setDeleteProj(null);setDeletingProj(false);loadSidebar();})
      .catch(function(err){message.error('刪除失敗: '+(err&&err.message||'error'));setDeletingProj(false);});
  }

  function doDeleteCat(){
    if(!deleteCat||!client)return;
    setDeletingCat(true);
    client.request({url:'docCategories:destroy',method:'delete',params:{filterByTk:deleteCat.id}})
      .then(function(){message.success('資料夾已刪除');setDeleteCat(null);setDeletingCat(false);loadSidebar();})
      .catch(function(err){message.error('刪除失敗: '+(err&&err.message||'error'));setDeletingCat(false);});
  }

  function doRenameCat(catId, newName){
    if(!newName||!newName.trim()||!client){setRenamingCatId(null);return;}
    client.request({url:'docCategories:update',method:'post',params:{filterByTk:catId},data:{name:newName.trim()}})
      .then(function(){setRenamingCatId(null);loadSidebar();})
      .catch(function(err){message.error('重新命名失敗: '+(err&&err.message||'error'));setRenamingCatId(null);});
  }

  function openProjPermModal(proj){
    setPermProj(proj);
    setPermViewerIds([]);setPermEditorIds([]);setPermSubscriberIds([]);setPermLoading(true);
    // 同步拉取所有 users（用於選擇器）
    if(allUsers.length===0&&client){
      client.request({url:'users:list',method:'get',params:{pageSize:200}})
        .then(function(res){setAllUsers((res.data&&res.data.data)||[]);});
    }
    if(!client)return;
    client.request({url:'docProjects:getPermissions',method:'get',params:{filterByTk:proj.id}})
      .then(function(res){
        var d=res.data&&res.data.data;
        setPermViewerIds((d&&d.viewerIds)||[]);
        setPermEditorIds((d&&d.editorIds)||[]);
        setPermSubscriberIds((d&&d.subscriberIds)||[]);
        setPermLoading(false);
      })
      .catch(function(){setPermLoading(false);});
  }

  function doSavePermissions(){
    if(!permProj||!client)return;
    setPermSaving(true);
    client.request({url:'docProjects:setPermissions',method:'post',params:{filterByTk:permProj.id},data:{viewerIds:permViewerIds,editorIds:permEditorIds,subscriberIds:permSubscriberIds}})
      .then(function(){message.success('專案權限已更新');setPermProj(null);setPermSaving(false);})
      .catch(function(err){message.error('儲存失敗: '+(err&&err.message||'error'));setPermSaving(false);});
  }

  function openCatPermModal(cat){
    setPermCat(cat);
    setPermCatOverride(false);setPermCatViewerIds([]);setPermCatEditorIds([]);setPermCatLoading(true);
    if(allUsers.length===0&&client){
      client.request({url:'users:list',method:'get',params:{pageSize:200}})
        .then(function(res){setAllUsers((res.data&&res.data.data)||[]);});
    }
    if(!client)return;
    client.request({url:'docCategories:getPermissions',method:'get',params:{filterByTk:cat.id}})
      .then(function(res){
        var d=res.data&&res.data.data;
        setPermCatOverride(!!(d&&d.overridePermission));
        setPermCatViewerIds((d&&d.viewerIds)||[]);
        setPermCatEditorIds((d&&d.editorIds)||[]);
        setPermCatLoading(false);
      })
      .catch(function(){setPermCatLoading(false);});
  }

  function doSaveCatPermissions(){
    if(!permCat||!client)return;
    setPermCatSaving(true);
    client.request({url:'docCategories:setPermissions',method:'post',params:{filterByTk:permCat.id},
      data:{overridePermission:permCatOverride,viewerIds:permCatViewerIds,editorIds:permCatEditorIds}})
      .then(function(){message.success('資料夾權限已更新');setPermCat(null);setPermCatSaving(false);loadSidebar();})
      .catch(function(err){message.error('儲存失敗: '+(err&&err.message||'error'));setPermCatSaving(false);});
  }

  var sidebarStyle={
    width:collapsed?56:270,flexShrink:0,background:'#1a2a3a',minHeight:'100vh',
    display:'flex',flexDirection:'column',position:'sticky',top:0,height:'100vh',overflow:'hidden',
    transition:'width 0.2s ease'
  };

  // 無群組的專案（groupId 為 null/undefined）
  var ungroupedProjects=projects.filter(function(p){return!p.groupId;});

  // 遞迴渲染資料夾（無限巢狀），baseIndent 是基礎縮排 px
  function renderCatTree(parentId, projId, depth){
    var indent = 40 + depth * 14;
    var children = cats.filter(function(c){return c.projectId===projId && c.parentId===parentId;}).slice().sort(function(a,b){
      var sa=a.sort==null?999:a.sort,sb=b.sort==null?999:b.sort;
      if(sa!==sb)return sa-sb;
      return String(a.name||'').localeCompare(String(b.name||''));
    });
    if(children.length===0) return null;
    return children.map(function(cat){
      var subCats=cats.filter(function(c){return c.parentId===cat.id;}).slice().sort(function(a,b){
        var sa=a.sort==null?999:a.sort,sb=b.sort==null?999:b.sort;
        if(sa!==sb)return sa-sb;
        return String(a.name||'').localeCompare(String(b.name||''));
      });
      var hasChildren=subCats.length>0;
      var isActive=String(activeCatId)===String(cat.id);
      var isExp=expanded[cat.id]===true; // 預設收起，true 才展開
      var isRenaming=renamingCatId===cat.id;
      var isDraggingThis=dragCatId===cat.id;
      var isDragOver=dragOverCatId===cat.id&&!isDraggingThis;
      function handleCatMouseDown(e){
        if(isRenaming||e.button!==0)return;
        var ref=_dragRef.current;
        ref.catId=cat.id;ref.projId=projId;ref.parentId=cat.parentId;ref.active=false;
        ref.timer=setTimeout(function(){
          ref.active=true;
          setDragCatId(cat.id);
          function onMouseMove(ev){
            // 找滑鼠下方的 cat element
            var els=document.elementsFromPoint(ev.clientX,ev.clientY);
            var overEl=els.find(function(el){return el.dataset&&el.dataset.catid&&el.dataset.catid!==String(cat.id);});
            setDragOverCatId(overEl?Number(overEl.dataset.catid):null);
          }
          function onMouseUp(){
            document.removeEventListener('mousemove',onMouseMove);
            document.removeEventListener('mouseup',onMouseUp);
            var overCatId=_dragRef.current.overCatId;
            setDragCatId(null);setDragOverCatId(null);_dragRef.current.active=false;
            if(!overCatId||overCatId===cat.id||!client)return;
            var siblings=cats.filter(function(c){return c.projectId===ref.projId&&c.parentId===ref.parentId;});
            var fromIdx=siblings.findIndex(function(c){return c.id===cat.id;});
            var toIdx=siblings.findIndex(function(c){return c.id===overCatId;});
            if(fromIdx===-1||toIdx===-1)return;
            var newOrder=siblings.slice();
            var moved=newOrder.splice(fromIdx,1)[0];
            newOrder.splice(toIdx,0,moved);
            client.request({url:'docCategories:reorder',method:'post',data:{ids:newOrder.map(function(c){return c.id;})}})
              .then(function(){loadSidebar();}).catch(function(){message.error('排序儲存失敗');});
          }
          document.addEventListener('mousemove',onMouseMove);
          document.addEventListener('mouseup',onMouseUp);
        },250);
        function onEarlyUp(){
          clearTimeout(ref.timer);
          document.removeEventListener('mouseup',onEarlyUp);
        }
        document.addEventListener('mouseup',onEarlyUp);
      }
      return h('div',{key:cat.id,
        'data-catid':cat.id,
        className:'dochub-cat-row'+(isActive?' dochub-cat-row-active':''),
        onMouseEnter:function(e){if(_dragRef.current.active)_dragRef.current.overCatId=cat.id;var a=e.currentTarget.querySelector('.dochub-cat-actions');if(a)a.style.opacity='1';},
        onMouseLeave:function(e){if(_dragRef.current.active&&_dragRef.current.overCatId===cat.id)_dragRef.current.overCatId=null;var a=e.currentTarget.querySelector('.dochub-cat-actions');if(a&&!isActive)a.style.opacity='0';}
      },
        h('div',{
          style:{padding:'5px 12px 5px '+indent+'px',display:'flex',alignItems:'center',justifyContent:'space-between',
            cursor:isRenaming?'text':(isDraggingThis?'grabbing':'grab'),
            color:isActive?'#fff':'#b8c6d6',fontSize:15,
            background:isDraggingThis?'rgba(22,136,255,0.08)':isDragOver?'rgba(22,136,255,0.14)':(isActive?'rgba(22,136,255,0.18)':'transparent'),
            borderLeft:isActive?'3px solid #1688ff':'3px solid transparent',
            borderRadius:'0 6px 6px 0',marginRight:6,
            transition:'background 0.12s',
            opacity:isDraggingThis?0.5:1},
          onMouseDown:handleCatMouseDown,
          onMouseEnter:function(e){if(!isActive&&!isDraggingThis)e.currentTarget.style.background='rgba(255,255,255,0.06)';},
          onMouseLeave:function(e){if(!isActive&&!isDraggingThis)e.currentTarget.style.background='transparent';},
          onClick:function(){if(isRenaming||_dragRef.current.active)return;onSelectProject(projId);onSelectCat(isActive?null:cat.id);}},
          h('span',{style:{flex:1,overflow:'hidden',display:'flex',alignItems:'center',minWidth:0,gap:4}},
            hasChildren
              ?h('span',{onClick:function(e){e.stopPropagation();toggleExpand(cat.id);},
                  style:{flexShrink:0,width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:13,color:isActive?'rgba(255,255,255,0.7)':'#6b8299',
                    transition:'transform 0.15s',transform:isExp?'rotate(90deg)':'rotate(0deg)',
                    cursor:'pointer',userSelect:'none'}},
                '❯')
              :h('span',{style:{flexShrink:0,width:18,opacity:0,fontSize:13}},'❯'),
            isRenaming
              ?h('input',{
                  autoFocus:true,
                  value:renameCatName,
                  onChange:function(e){setRenameCatName(e.target.value);},
                  onBlur:function(){doRenameCat(cat.id,renameCatName);},
                  onKeyDown:function(e){
                    if(e.key==='Enter'){doRenameCat(cat.id,renameCatName);}
                    if(e.key==='Escape'){setRenamingCatId(null);}
                    e.stopPropagation();
                  },
                  onClick:function(e){e.stopPropagation();},
                  style:{background:'transparent',border:'none',borderBottom:'1px solid #1688ff',color:'#fff',
                    fontSize:15,outline:'none',width:'100%',padding:'0 2px'}
                })
              :h('span',{
                  style:{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},
                  onDoubleClick:function(e){e.stopPropagation();setRenamingCatId(cat.id);setRenameCatName(cat.name);}
                },'📂 ',cat.name)
          ),
          h('span',{className:'dochub-cat-actions',style:{display:'flex',alignItems:'center',gap:3,flexShrink:0,opacity:0}},
            h('span',{title:'重新命名',onClick:function(e){e.stopPropagation();setRenamingCatId(cat.id);setRenameCatName(cat.name);},
              style:{color:'#8ba4be',fontSize:13,cursor:'pointer',padding:'0 3px',lineHeight:1}},h(EditOutlined)),
            h('span',{title:'新增子資料夾',onClick:function(e){e.stopPropagation();setCreateCatProjId(projId);setCreateCatParentId(cat.id);setNewCatName('');},
              style:{color:'#8ba4be',fontSize:16,cursor:'pointer',padding:'0 3px',lineHeight:1,fontWeight:300}},'+')
          )
        ),
        isExp&&renderCatTree(cat.id, projId, depth+1)
      );
    });
  }

  function renderProject(proj){
    var isProjActive=activeProjectId===proj.id;
    var isProjExp=expandedProj[proj.id]===true; // 預設收起
    return h('div',{key:proj.id,style:{marginBottom:2}},
      h('div',{
        style:{padding:'9px 10px 9px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',
          color:isProjActive?'#fff':'#d4dfe9',fontSize:16,fontWeight:600,
          background:isProjActive?'rgba(22,136,255,0.22)':'transparent',
          borderLeft:isProjActive?'3px solid #1688ff':'3px solid transparent',
          borderRadius:'0 8px 8px 0',marginRight:6,
          transition:'background 0.12s'},
        onMouseEnter:function(e){if(!isProjActive)e.currentTarget.style.background='rgba(255,255,255,0.07)';},
        onMouseLeave:function(e){if(!isProjActive)e.currentTarget.style.background='transparent';}},
        // 展開/收合箭頭
        h('span',{
          onClick:function(e){e.stopPropagation();setExpandedProj(function(prev){var n=Object.assign({},prev);n[proj.id]=!isProjExp;return n;});},
          style:{width:20,height:20,display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:13,color:isProjActive?'rgba(255,255,255,0.6)':'#7a92a8',
            transition:'transform 0.15s',transform:isProjExp?'rotate(90deg)':'rotate(0deg)',
            cursor:'pointer',userSelect:'none',flexShrink:0,marginRight:4}
        },'❯'),
        h('span',{
          style:{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},
          onClick:function(){onSelectProject(proj.id);onSelectCat(null);}
        },'📁 ',proj.name),
        h('div',{style:{display:'flex',alignItems:'center',gap:5,flexShrink:0,marginLeft:4}},
          h('span',{style:{background:isProjActive?'rgba(255,255,255,0.25)':'rgba(22,136,255,0.3)',
            borderRadius:10,padding:'2px 8px',fontSize:13,color:isProjActive?'#fff':'#8ab4d4',fontWeight:700,minWidth:22,textAlign:'center'}},
            docCount[proj.id]!=null?docCount[proj.id]:'…'),
          h('span',{
            title:'新增根資料夾',
            onClick:function(e){e.stopPropagation();setCreateCatProjId(proj.id);setCreateCatParentId(null);setNewCatName('');},
            style:{color:'#8ba4be',fontSize:18,cursor:'pointer',padding:'0 3px',lineHeight:1,fontWeight:300,opacity:0.8}},'+')

        )
      ),
      // 資料夾樹，可收合
      isProjExp&&h('div',{style:{paddingLeft:8}},renderCatTree(null, proj.id, 0))
    );
  }

  return h('div',{style:sidebarStyle},
    // 收合模式：只顯示「文件」icon + 展開按鈕
    collapsed&&h('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'10px 0 8px',flexShrink:0}},
      h('div',{
        title:'展開側欄',
        onClick:function(){setCollapsed(false);},
        style:{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
          borderRadius:6,color:'#6b8299',fontSize:16,transition:'all 0.15s',background:'rgba(255,255,255,0.04)'},
        onMouseEnter:function(e){e.currentTarget.style.background='rgba(255,255,255,0.1)';e.currentTarget.style.color='#fff';},
        onMouseLeave:function(e){e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.color='#6b8299';}
      },'»'),
      h('div',{title:'總覽',onClick:function(){onSelectProject(null);onSelectCat(null);setCollapsed(false);},
        style:{width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
          borderRadius:8,fontSize:20,color:(!activeProjectId&&!activeCatId)?'#fff':'#6b8299',
          background:(!activeProjectId&&!activeCatId)?'rgba(22,136,255,0.2)':'transparent',transition:'all 0.12s'},
        onMouseEnter:function(e){e.currentTarget.style.background='rgba(255,255,255,0.08)';},
        onMouseLeave:function(e){e.currentTarget.style.background=(!activeProjectId&&!activeCatId)?'rgba(22,136,255,0.2)':'transparent';}
      },'🏠')
    ),
    // 展開模式：搜尋列 + 收合按鈕 同一行
    !collapsed&&h('div',{style:{padding:'10px 12px 14px',display:'flex',alignItems:'center',gap:8,flexShrink:0}},
      h('div',{style:{flex:1,background:'rgba(255,255,255,0.07)',borderRadius:8,padding:'9px 12px',
        display:'flex',alignItems:'center',gap:8,border:'1px solid rgba(255,255,255,0.08)',
        transition:'border-color 0.15s'},
        onFocus:function(e){e.currentTarget.style.borderColor='rgba(22,136,255,0.5)';},
        onBlur:function(e){e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';}},
        h(SearchOutlined,{style:{color:'#6b8299',fontSize:15}}),
        h('input',{value:search,onChange:function(e){onSearch(e.target.value);},placeholder:'搜尋... (⌘K)',
          className:'dochub-search-input',
          style:{background:'transparent',border:'none',outline:'none',color:'#dde6f0',fontSize:15,flex:1,width:'100%'}})
      ),
      h('div',{
        title:'收合側欄',
        onClick:function(){setCollapsed(true);},
        style:{width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
          borderRadius:6,color:'#6b8299',fontSize:16,flexShrink:0,
          transition:'all 0.15s',background:'rgba(255,255,255,0.04)'},
        onMouseEnter:function(e){e.currentTarget.style.background='rgba(255,255,255,0.1)';e.currentTarget.style.color='#fff';},
        onMouseLeave:function(e){e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.color='#6b8299';}
      },'«')
    ),
    // Groups + Projects + Categories
    !collapsed&&h('div',{style:{flex:1,overflow:'auto',minHeight:0,paddingBottom:4}},
      // 總覽
      h('div',{
        style:{padding:'8px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',
          color:(!activeProjectId&&!activeCatId)?'#fff':'#b0bfcc',fontSize:16,fontWeight:600,
          background:(!activeProjectId&&!activeCatId)?'rgba(22,136,255,0.2)':'transparent',
          borderLeft:(!activeProjectId&&!activeCatId)?'3px solid #1688ff':'3px solid transparent',
          borderRadius:'0 8px 8px 0',marginRight:6,marginBottom:6,transition:'background 0.12s'},
        onMouseEnter:function(e){if(activeProjectId||activeCatId)e.currentTarget.style.background='rgba(255,255,255,0.06)';},
        onMouseLeave:function(e){if(activeProjectId||activeCatId)e.currentTarget.style.background='transparent';},
        onClick:function(){onSelectProject(null);onSelectCat(null);}},
        h('span',null,'🏠 總覽'),
        h('span',{
          title:'全部縮起/展開',
          style:{fontSize:12,color:'#4a6a85',padding:'0 4px',lineHeight:1,cursor:'pointer'},
          onClick:function(e){
            e.stopPropagation();
            var allExp=groups.length>0&&groups.every(function(g){return groupExpanded[g.id]===true;});
            var next={};
            groups.forEach(function(g){next[g.id]=!allExp;});
            setGroupExpanded(next);
          }
        },(function(){var allExp=groups.length>0&&groups.every(function(g){return groupExpanded[g.id]===true;});return allExp?'⊟':'⊞';})())
      ),
      // 群組標題列已移除
      // 群組列表
      groups.map(function(grp){
        var grpProjects=projects.filter(function(p){return p.groupId===grp.id;});
        var isGrpExp=groupExpanded[grp.id]===true;
        return h('div',{key:grp.id,style:{marginBottom:4}},
          h('div',{
            style:{padding:'7px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',
              color:'#8aa8c4',fontSize:13,fontWeight:700,letterSpacing:'0.2px',
              borderRadius:'0 6px 6px 0',marginRight:6,transition:'background 0.12s'},
            onMouseEnter:function(e){e.currentTarget.style.background='rgba(255,255,255,0.05)';},
            onMouseLeave:function(e){e.currentTarget.style.background='transparent';},
            onClick:function(){setGroupExpanded(function(e){var n=Object.assign({},e);n[grp.id]=!isGrpExp;return n;});}},
            h('span',{style:{display:'flex',alignItems:'center',gap:6}},
              h('span',{style:{fontSize:11,color:'#4a6a85',transition:'transform 0.15s',
                display:'inline-block',transform:isGrpExp?'rotate(90deg)':'rotate(0deg)'}},'❯'),
              h('span',null,'🗂 ',grp.name)
            ),
            isAdmin&&h('span',{
              title:'在此群組新增專案',
              style:{fontSize:14,lineHeight:1,color:'#4a6a85',padding:'0 4px',borderRadius:4,cursor:'pointer',transition:'color 0.15s,background 0.15s'},
              onMouseEnter:function(e){e.currentTarget.style.color='#60a5fa';e.currentTarget.style.background='rgba(255,255,255,0.1)';},
              onMouseLeave:function(e){e.currentTarget.style.color='#4a6a85';e.currentTarget.style.background='transparent';},
              onClick:function(e){e.stopPropagation();setCreateProjGroupId(grp.id);setSelectedProjGroupId(grp.id);setNewProjName('');setNewProjDesc('');/* folders 預設改由 server 樹狀產生，不需 client reset */}
            },'+'),
          ),
          isGrpExp&&grpProjects.map(renderProject)
        );
      }),
      // 無群組的專案不再顯示（server 強制 groupId 必填，過渡區塊已移除）
      groups.length===0&&h('div',{style:{padding:'20px 16px',color:'#4a6a85',fontSize:14,textAlign:'center',lineHeight:1.6}},
        isAdmin
          ? h('div',null,h('div',{style:{fontSize:28,marginBottom:8}},'📁'),h('div',null,'點擊上方 + 建立第一個群組'))
          : '（尚無內容）'
      )
    ),
    // Sidebar bottom 區塊已移除（最近查看 / 標籤 / 稽核日誌 / 範本管理 改放 ListPage 頂部工具列）

    // ── Modals ──
    // 新增群組
    h(Modal,{
      title:'新增群組',
      open:showCreateGroup,
      onCancel:function(){setShowCreateGroup(false);},
      width:400,
      footer:h(Space,null,
        h(Button,{onClick:function(){setShowCreateGroup(false);}},'取消'),
        h(Button,{type:'primary',loading:creatingGroup,onClick:doCreateGroup},'建立')
      )},
      h('div',{style:{marginBottom:8,fontSize:13,color:'#73808c'}},'群組名稱（例：專案、共用、部門文件）'),
      h(Input,{value:newGroupName,onChange:function(e){setNewGroupName(e.target.value);},placeholder:'群組名稱...',autoFocus:true})
    ),

    // 新增專案
    h(Modal,{
      title:'新增專案',
      open:createProjGroupId!==null,
      onCancel:function(){setCreateProjGroupId(null);setSelectedProjGroupId(null);setNewProjName('');setNewProjDesc('');/* folders 預設改由 server 樹狀產生，不需 client reset */},
      width:520,
      footer:h(Space,null,
        h(Button,{onClick:function(){setCreateProjGroupId(null);setSelectedProjGroupId(null);setNewProjName('');setNewProjDesc('');/* folders 預設改由 server 樹狀產生，不需 client reset */}},'取消'),
        h(Button,{type:'primary',loading:creatingProj,onClick:doCreateProject},'建立專案')
      )},
      // 所屬群組（必填）
      h('div',{style:{marginBottom:16}},
        h('div',{style:{fontSize:13,fontWeight:600,color:'#1e293b',marginBottom:6}},
          '所屬群組 ',h('span',{style:{color:'#ef4444'}},'*')
        ),
        h(Select,{
          style:{width:'100%'},
          size:'large',
          placeholder:'請選擇群組',
          value:selectedProjGroupId||undefined,
          onChange:function(v){setSelectedProjGroupId(v);},
          options:groups.map(function(g){return{value:g.id,label:g.name};})
        })
      ),
      // 專案名稱
      h('div',{style:{marginBottom:16}},
        h('div',{style:{fontSize:13,fontWeight:600,color:'#1e293b',marginBottom:6}},'專案名稱 ',h('span',{style:{color:'#ef4444'}},'*')),
        h(Input,{value:newProjName,onChange:function(e){setNewProjName(e.target.value);},
          placeholder:'輸入專案名稱...',autoFocus:true,size:'large'})
      ),
      // 描述
      h('div',{style:{marginBottom:16}},
        h('div',{style:{fontSize:13,fontWeight:600,color:'#1e293b',marginBottom:6}},'描述（選填）'),
        h(Input.TextArea,{value:newProjDesc,onChange:function(e){setNewProjDesc(e.target.value);},
          placeholder:'簡短描述此專案的用途...',rows:2,size:'large'})
      ),
      // 初始資料夾（共用群組下的專案不自動建子資料夾）
      (function(){
        var pickedGroup=(groups||[]).find(function(g){return g.id===selectedProjGroupId;});
        var isShared=pickedGroup&&/共用|shared/i.test(pickedGroup.name||'');
        if(isShared){
          return h('div',null,
            h('div',{style:{fontSize:13,fontWeight:600,color:'#1e293b',marginBottom:8}},'初始資料夾結構（共用知識庫）'),
            h('div',{style:{
              background:'#f0f9ff',borderRadius:8,border:'1px dashed #93c5fd',
              padding:'14px 16px',fontSize:13,color:'#1e40af',lineHeight:1.6
            }},
              h('div',{style:{fontWeight:600,marginBottom:4}},'ℹ️ 此專案將作為「頂層分類」'),
              '共用群組下的專案不自動建立子資料夾，',h('br'),
              '建立後可自行新增所需的資料夾結構。'
            )
          );
        }
        var tree=SDLC_TREE;
        var treeLabel='初始資料夾結構（SDLC 專案）';
        function renderNode(node,depth,keyPath){
          var hasChildren=Array.isArray(node.children)&&node.children.length>0;
          return h('div',{key:keyPath,style:{display:'flex',flexDirection:'column'}},
            h('div',{style:{
              display:'flex',alignItems:'center',gap:6,
              padding:'3px 0',paddingLeft:depth*18,
              fontSize:13,color:depth===0?'#0f172a':'#334155',
              fontWeight:depth===0?600:400
            }},
              h('span',{style:{color:hasChildren?'#64748b':'#94a3b8',fontSize:12,width:14,display:'inline-block',textAlign:'center'}},
                hasChildren?'📂':'📁'
              ),
              h('span',null,node.name)
            ),
            hasChildren&&node.children.map(function(ch,i){return renderNode(ch,depth+1,keyPath+'/'+i);})
          );
        }
        return h('div',null,
          h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}},
            h('div',{style:{fontSize:13,fontWeight:600,color:'#1e293b'}},treeLabel),
            h('div',{style:{fontSize:12,color:'#94a3b8'}},'建立專案後自動依此樹產生')
          ),
          h('div',{style:{
            background:'#f8fafc',borderRadius:8,border:'1px solid #e2e8f0',
            padding:'10px 12px',display:'flex',flexDirection:'column',gap:2,
            maxHeight:300,overflowY:'auto'}},
            tree.map(function(n,i){return renderNode(n,0,String(i));})
          )
        );
      })()
    ),

    // 新增資料夾
    h(Modal,{
      title:createCatParentId?'新增子資料夾':'新增資料夾',
      open:createCatProjId!==null,
      onCancel:function(){setCreateCatProjId(null);setCreateCatParentId(null);setNewCatName('');setNewCatDesc('');},
      width:440,
      footer:h(Space,null,
        h(Button,{onClick:function(){setCreateCatProjId(null);setCreateCatParentId(null);setNewCatName('');setNewCatDesc('');}},'取消'),
        h(Button,{type:'primary',loading:creatingCat,onClick:doCreateCategory},'建立')
      )},
      createCatParentId&&h('div',{style:{marginBottom:12,fontSize:12,color:'#8c99ad'}},'建立在「',
        (cats.find(function(c){return c.id===createCatParentId;})||{}).name||'',
        '」底下'),
      h('div',{style:{marginBottom:16}},
        h('div',{style:{marginBottom:6,fontSize:13,fontWeight:600,color:'#1e293b'}},'資料夾名稱 ',h('span',{style:{color:'#ef4444'}},'*')),
        h(Input,{value:newCatName,onChange:function(e){setNewCatName(e.target.value);},placeholder:'資料夾名稱...',autoFocus:true,size:'large'})
      ),
      h('div',null,
        h('div',{style:{marginBottom:6,fontSize:13,fontWeight:600,color:'#1e293b'}},'描述（選填）'),
        h(Input.TextArea,{value:newCatDesc,onChange:function(e){setNewCatDesc(e.target.value);},placeholder:'簡短描述此資料夾的用途...',rows:3,size:'large'})
      )
    ),

    // 刪除專案確認
    h(Modal,{
      title:h('span',null,h(ExclamationCircleOutlined,{style:{color:'#ff4d4f',marginRight:8}}),'確認刪除專案'),
      open:!!deleteProj,
      onCancel:function(){setDeleteProj(null);},
      width:440,
      footer:h(Space,null,
        h(Button,{onClick:function(){setDeleteProj(null);}},'取消'),
        h(Button,{type:'primary',danger:true,loading:deletingProj,onClick:doDeleteProject},'確認刪除')
      )},
      h(Alert,{
        type:'error',
        showIcon:true,
        message:'此操作不可逆',
        description:h('span',null,
          '確定要刪除專案「',
          h('strong',null,deleteProj&&deleteProj.name),
          '」？此操作無法復原，但專案下的文件不會被刪除。'
        ),
        style:{marginBottom:0}
      })
    ),
    // 刪除資料夾確認
    h(Modal,{
      title:h('span',null,h(ExclamationCircleOutlined,{style:{color:'#ff4d4f',marginRight:8}}),'確認刪除資料夾'),
      open:!!deleteCat,
      onCancel:function(){setDeleteCat(null);},
      width:440,
      footer:h(Space,null,
        h(Button,{onClick:function(){setDeleteCat(null);}},'取消'),
        h(Button,{type:'primary',danger:true,loading:deletingCat,onClick:doDeleteCat},'確認刪除')
      )},
      h(Alert,{
        type:'error',
        showIcon:true,
        message:'此操作不可逆',
        description:h('span',null,
          '確定要刪除資料夾「',
          h('strong',null,deleteCat&&deleteCat.name),
          '」？資料夾下的子資料夾也會一併刪除，但文件不會被刪除。'
        ),
        style:{marginBottom:0}
      })
    ),
    // 專案權限 Modal
    h(Modal,{
      title:h('span',null,'🔐 專案權限設定 — ',h('strong',null,permProj&&permProj.name)),
      open:!!permProj,
      onCancel:function(){setPermProj(null);},
      width:520,
      footer:h(Space,null,
        h(Button,{onClick:function(){setPermProj(null);}},'取消'),
        h(Button,{type:'primary',loading:permSaving,onClick:doSavePermissions},'儲存')
      )},
      permLoading
        ? h('div',{style:{textAlign:'center',padding:32}},h(Spin,null))
        : h('div',null,
            h(Alert,{type:'info',showIcon:true,style:{marginBottom:16},
              message:'權限階層：Viewer ⊂ Subscriber ⊂ Editor（高權限自動包含低權限）',
              description:h('div',null,
                h('table',{style:{width:'100%',fontSize:12,marginTop:6,borderCollapse:'collapse'}},
                  h('thead',null,
                    h('tr',{style:{background:'#f5f5f5'}},
                      h('th',{style:{padding:'4px 8px',textAlign:'left',border:'1px solid #e8e8e8'}},'角色'),
                      h('th',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8'}},'看到專案'),
                      h('th',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8'}},'收通知'),
                      h('th',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8'}},'編輯文件')
                    )
                  ),
                  h('tbody',null,
                    h('tr',null,
                      h('td',{style:{padding:'4px 8px',border:'1px solid #e8e8e8'}},'👁 Viewer'),
                      h('td',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8',color:'#52c41a'}},'✓'),
                      h('td',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8',color:'#bfbfbf'}},'—'),
                      h('td',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8',color:'#bfbfbf'}},'—')
                    ),
                    h('tr',null,
                      h('td',{style:{padding:'4px 8px',border:'1px solid #e8e8e8'}},'🔔 Subscriber'),
                      h('td',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8',color:'#52c41a'}},'✓'),
                      h('td',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8',color:'#52c41a'}},'✓'),
                      h('td',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8',color:'#bfbfbf'}},'—')
                    ),
                    h('tr',null,
                      h('td',{style:{padding:'4px 8px',border:'1px solid #e8e8e8'}},'✏️ Editor'),
                      h('td',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8',color:'#52c41a'}},'✓'),
                      h('td',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8',color:'#52c41a'}},'✓'),
                      h('td',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8',color:'#52c41a'}},'✓')
                    )
                  )
                ),
                h('div',{style:{marginTop:6,fontSize:12,color:'#666'}},'💡 提示：每個用戶只需勾選在「最高權限」欄位即可，系統會自動授予較低權限。')
              )
            }),
            h('div',{style:{marginBottom:16}},
              h('div',{style:{fontWeight:600,marginBottom:8,color:'#333'}},'📖 可查看（Viewer）'),
              h('div',{style:{fontSize:12,color:'#888',marginBottom:8}},'可看到此專案及其文件清單，但不會收到通知，也不能編輯'),
              h(Select,{
                mode:'multiple',
                style:{width:'100%'},
                placeholder:'選擇可查看的用戶...',
                value:permViewerIds,
                onChange:function(v){setPermViewerIds(v);},
                optionFilterProp:'label',
                options:allUsers.map(function(u){return{
                  value:u.id,
                  label:(u.nickname||u.username||u.email||('User#'+u.id))
                };}),
                filterOption:function(input,opt){
                  return (opt.label||'').toLowerCase().includes(input.toLowerCase());
                }
              })
            ),
            h('div',{style:{marginBottom:16}},
              h('div',{style:{fontWeight:600,marginBottom:8,color:'#333'}},'📬 訂閱通知（Subscriber）'),
              h('div',{style:{fontSize:12,color:'#888',marginBottom:8}},'可查看 + 文件有任何新增/更新時收到站內信通知'),
              h(Select,{
                mode:'multiple',
                style:{width:'100%'},
                placeholder:'選擇要訂閱通知的用戶...',
                value:permSubscriberIds,
                onChange:function(v){setPermSubscriberIds(v);},
                optionFilterProp:'label',
                options:allUsers.map(function(u){return{
                  value:u.id,
                  label:(u.nickname||u.username||u.email||('User#'+u.id))
                };}),
                filterOption:function(input,opt){
                  return (opt.label||'').toLowerCase().includes(input.toLowerCase());
                }
              })
            ),
            h('div',null,
              h('div',{style:{fontWeight:600,marginBottom:8,color:'#333'}},'✏️ 可編輯（Editor）'),
              h('div',{style:{fontSize:12,color:'#888',marginBottom:8}},'可查看 + 收通知 + 編輯/新增/刪除此專案下的文件'),
              h(Select,{
                mode:'multiple',
                style:{width:'100%'},
                placeholder:'選擇可編輯的用戶...',
                value:permEditorIds,
                onChange:function(v){setPermEditorIds(v);},
                optionFilterProp:'label',
                options:allUsers.map(function(u){return{
                  value:u.id,
                  label:(u.nickname||u.username||u.email||('User#'+u.id))
                };}),
                filterOption:function(input,opt){
                  return (opt.label||'').toLowerCase().includes(input.toLowerCase());
                }
              })
            )
          )
    ),

    // ── 資料夾權限 Modal ──────────────────────────────────────────────────────
    h(Modal,{
      title:h('span',null,'🔐 資料夾權限設定 — ',h('strong',null,permCat&&permCat.name)),
      open:!!permCat,
      onCancel:function(){setPermCat(null);},
      width:540,
      footer:h(Space,null,
        h(Button,{onClick:function(){setPermCat(null);}},'取消'),
        h(Button,{type:'primary',loading:permCatSaving,onClick:doSaveCatPermissions},'儲存')
      )},
      permCatLoading
        ? h('div',{style:{textAlign:'center',padding:32}},h(Spin,null))
        : h('div',null,
            // 繼承 / 自訂 切換
            h('div',{style:{marginBottom:20,padding:'12px 16px',background:'#f8fafc',borderRadius:8,border:'1px solid #e8ecf0'}},
              h('div',{style:{fontWeight:600,marginBottom:12,color:'#333'}},'權限模式'),
              h('div',{style:{display:'flex',flexDirection:'column',gap:10}},
                h('label',{style:{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}},
                  h('input',{type:'radio',checked:!permCatOverride,onChange:function(){setPermCatOverride(false);},style:{marginTop:2}}),
                  h('div',null,
                    h('div',{style:{fontWeight:500,color:'#333'}},'繼承專案設定（預設）'),
                    h('div',{style:{fontSize:12,color:'#888',marginTop:2}},'套用此資料夾所屬專案的 Viewer / Editor 設定')
                  )
                ),
                h('label',{style:{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}},
                  h('input',{type:'radio',checked:permCatOverride,onChange:function(){setPermCatOverride(true);},style:{marginTop:2}}),
                  h('div',null,
                    h('div',{style:{fontWeight:500,color:'#faad14'}},'自訂此資料夾的權限'),
                    h('div',{style:{fontSize:12,color:'#888',marginTop:2}},'獨立設定，不受專案權限影響')
                  )
                )
              )
            ),
            // 自訂設定區（只有選自訂才啟用）
            h('div',{style:{opacity:permCatOverride?1:0.4,pointerEvents:permCatOverride?'auto':'none',transition:'opacity 0.2s'}},
              h('div',{style:{marginBottom:16}},
                h('div',{style:{fontWeight:600,marginBottom:8,color:'#333'}},'📖 可查看（Viewer）'),
                h('div',{style:{fontSize:12,color:'#888',marginBottom:8}},'可查看此資料夾下的所有文件'),
                h(Select,{
                  mode:'multiple',style:{width:'100%'},
                  placeholder:'選擇可查看的用戶...',
                  value:permCatViewerIds,
                  onChange:function(v){setPermCatViewerIds(v);},
                  optionFilterProp:'label',
                  options:allUsers.map(function(u){return{value:u.id,label:(u.nickname||u.username||u.email||('User#'+u.id))};})
                })
              ),
              h('div',null,
                h('div',{style:{fontWeight:600,marginBottom:8,color:'#333'}},'✏️ 可編輯（Editor）'),
                h('div',{style:{fontSize:12,color:'#888',marginBottom:8}},'可查看及編輯此資料夾下的所有文件'),
                h(Select,{
                  mode:'multiple',style:{width:'100%'},
                  placeholder:'選擇可編輯的用戶...',
                  value:permCatEditorIds,
                  onChange:function(v){setPermCatEditorIds(v);},
                  optionFilterProp:'label',
                  options:allUsers.map(function(u){return{value:u.id,label:(u.nickname||u.username||u.email||('User#'+u.id))};})
                })
              )
            )
          )
    )
  );
}

// ── ResizableTitle ───────────────────────────────────────────────────────────
function ResizableTitle(props){
  var onResize=props.onResize,width=props.width,children=props.children,style=props.style;
  var rest={};
  Object.keys(props).forEach(function(k){
    if(k!=='onResize'&&k!=='width')rest[k]=props[k];
  });
  if(!onResize)return h('th',rest,children);
  function handleMouseDown(e){
    e.preventDefault();
    var startX=e.clientX;
    var startW=width||100;
    function onMouseMove(ev){
      var newW=Math.max(60,startW+(ev.clientX-startX));
      onResize(newW);
    }
    function onMouseUp(){
      document.removeEventListener('mousemove',onMouseMove);
      document.removeEventListener('mouseup',onMouseUp);
    }
    document.addEventListener('mousemove',onMouseMove);
    document.addEventListener('mouseup',onMouseUp);
  }
  return h('th',Object.assign({},rest,{style:Object.assign({},style,{position:'relative'})}),
    children,
    h('div',{
      onClick:function(e){e.stopPropagation();},
      onMouseDown:handleMouseDown,
      style:{position:'absolute',right:0,top:0,bottom:0,width:6,cursor:'col-resize',
        background:'transparent',zIndex:1,userSelect:'none',
        borderRight:'2px solid transparent',transition:'border-color 0.15s'},
      onMouseEnter:function(e){e.currentTarget.style.borderRightColor='#1677ff';},
      onMouseLeave:function(e){e.currentTarget.style.borderRightColor='transparent';}
    })
  );
}

// ── Template helpers ──────────────────────────────────────────────────────────
var TEMPLATE_PREFIX = 'TEMPLATE_FORM_V1\n';
function isTemplateContent(content) {
  return typeof content === 'string' && content.startsWith(TEMPLATE_PREFIX);
}
function parseTemplateContent(content) {
  try { return JSON.parse(content.slice(TEMPLATE_PREFIX.length)); } catch(e) { return null; }
}
function labelToName(label) {
  return label.trim().toLowerCase().replace(/[\s\u4e00-\u9fff]+/g,'_').replace(/[^a-z0-9_]/g,'').replace(/^_+|_+$/g,'')||('f_'+Math.random().toString(36).slice(2,7));
}
function genFieldId() { return 'f_'+Math.random().toString(36).slice(2,9); }

// ── NewDocModal ───────────────────────────────────────────────────────────────
function NewDocModal(props) {
  // props: open, onCancel, onFreeWrite, onTemplate, onGitSync, onImportFile, hasCat
  var open = props.open; var onCancel = props.onCancel;
  var onFreeWrite = props.onFreeWrite; var onTemplate = props.onTemplate;
  var onGitSync = props.onGitSync; var onImportFile = props.onImportFile;
  var hasCat = !!props.hasCat;
  function cardStyle(disabled) {
    return {border:'2px solid '+(disabled?'#f0f0f0':'#e5e7eb'),borderRadius:12,padding:'32px 16px',textAlign:'center',
      cursor:disabled?'not-allowed':'pointer',transition:'all 0.2s',
      background:disabled?'#fafafa':'#ffffff',opacity:disabled?0.5:1,
      minHeight:180,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center'};
  }
  function makeCard(emoji, title, desc, onClick, disabled) {
    return h(Tooltip,{title:disabled?'請先在左側選擇資料夾':null},
      h('div',{
        onClick:disabled?null:onClick,
        style:cardStyle(disabled),
        onMouseEnter:function(e){if(!disabled){e.currentTarget.style.borderColor='#1677ff';e.currentTarget.style.background='#e6f4ff';e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(22,119,255,0.15)';}},
        onMouseLeave:function(e){if(!disabled){e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.background='#ffffff';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}
      },
        h('div',{style:{fontSize:48,marginBottom:14,lineHeight:1}},emoji),
        h('div',{style:{fontSize:17,fontWeight:700,color:disabled?'#bbb':'#1a1f26',marginBottom:8}},title),
        h('div',{style:{fontSize:13,color:'#64748b',lineHeight:1.5}},desc)
      )
    );
  }
  return h(Modal,{title:h('span',{style:{fontSize:19,fontWeight:700}},'新增文件'),open:open,onCancel:onCancel,footer:null,width:900,centered:true},
    h('div',{style:{display:'flex',flexDirection:'column',gap:20,padding:'12px 0 4px'}},
      !hasCat&&h('div',{style:{background:'#fffbe6',border:'1px solid #ffe58f',borderRadius:8,padding:'12px 16px',fontSize:14,color:'#ad6800'}},
        '⚠️ 請先在左側選擇資料夾，才能新增文件'
      ),
      h('p',{style:{color:'#475569',margin:0,fontSize:15}},'請選擇新增方式：'),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:16}},
        makeCard('✍️','自由撰寫','Markdown 格式自由撰寫',onFreeWrite,!hasCat),
        makeCard('📋','使用範本','使用預設表單範本填寫',onTemplate,!hasCat),
        makeCard('📄','從檔案匯入','Word / Excel / PDF 轉 Markdown',onImportFile,!hasCat),
        makeCard('🔄','Git 同步','從 GitHub 倉庫拉取文件',onGitSync,!hasCat)
      )
    )
  );
}

// ── ImportFromFileModal ────────────────────────────────────────────────────────
function ImportFromFileModal(props) {
  // props: open, onCancel, onConfirm({title,content}), client
  var open = props.open; var onCancel = props.onCancel; var onConfirm = props.onConfirm;
  var client = props.client;

  var _f=useState(null); var file=_f[0]; var setFile=_f[1];
  var _l=useState(false); var loading=_l[0]; var setLoading=_l[1];
  var _r=useState(null); var result=_r[0]; var setResult=_r[1];
  var _e=useState(''); var errMsg=_e[0]; var setErrMsg=_e[1];
  var _t=useState(''); var title=_t[0]; var setTitle=_t[1];

  useEffect(function(){
    if(!open){ setFile(null); setLoading(false); setResult(null); setErrMsg(''); setTitle(''); }
  },[open]);

  function handleFileChange(e){
    var f = e.target.files && e.target.files[0];
    if(!f) return;
    setFile(f); setResult(null); setErrMsg('');
    setLoading(true);
    var fd = new FormData();
    fd.append('file', f);
    client.request({url:'docDocuments:importFromFile', method:'post', data: fd})
      .then(function(res){
        // NocoBase wraps ctx.body as res.data.data; fallback to res.data for compat
        var raw = res && res.data;
        var d = (raw && raw.data && typeof raw.data==='object') ? raw.data : (raw || {});
        if(d.ok){
          setResult(d);
          setTitle(d.title || f.name.replace(/\.[^.]+$/, ''));
        } else {
          setErrMsg(d.error || '轉換失敗');
        }
      })
      .catch(function(err){
        setErrMsg((err && err.message) || '呼叫轉換服務失敗');
      })
      .finally(function(){ setLoading(false); });
  }

  function handleConfirm(){
    if(!result || !title.trim()) return;
    onConfirm({title: title.trim(), content: result.markdown || ''});
  }

  return h(Modal,{
    title: h('span',{style:{fontSize:18,fontWeight:700}},'📄 從檔案匯入'),
    open:open, onCancel:onCancel, width:820, centered:true,
    okText:'建立文件', cancelText:'取消',
    okButtonProps:{disabled:!result||!title.trim(),size:'large'},
    cancelButtonProps:{size:'large'},
    onOk: handleConfirm
  },
    h('div',{style:{display:'flex',flexDirection:'column',gap:16,padding:'8px 0'}},
      h('div',{style:{fontSize:14,color:'#475569'}},
        '支援格式：Word (.docx) / Excel (.xlsx) / PDF / PowerPoint (.pptx) / HTML / CSV / JSON / TXT'
      ),
      h('div',{style:{border:'2px dashed #cbd5e1',borderRadius:10,padding:'24px',textAlign:'center',background:'#f8fafc'}},
        h('input',{type:'file',id:'dochub-import-file',style:{display:'none'},
          accept:'.docx,.doc,.xlsx,.xls,.pptx,.ppt,.pdf,.html,.htm,.csv,.json,.xml,.txt,.md,.msg,.epub',
          onChange: handleFileChange}),
        h('label',{htmlFor:'dochub-import-file',style:{cursor:'pointer',display:'inline-block'}},
          h('div',{style:{fontSize:44,marginBottom:8}},'📁'),
          h(Button,{type:'primary',size:'large',onClick:function(){document.getElementById('dochub-import-file').click();}},
            file ? '重新選擇檔案' : '選擇檔案'),
          file && h('div',{style:{marginTop:10,fontSize:13,color:'#475569'}},
            '已選：',h('strong',null,file.name),
            ' (',Math.round(file.size/1024),' KB)')
        )
      ),
      loading && h('div',{style:{textAlign:'center',padding:'20px'}},
        h(Spin,{size:'large'}),
        h('div',{style:{marginTop:10,fontSize:14,color:'#64748b'}},'轉換中...')
      ),
      errMsg && h(Alert,{type:'error',message:'轉換失敗',description:errMsg,showIcon:true}),
      result && h('div',{style:{display:'flex',flexDirection:'column',gap:12}},
        h(Alert,{type:'success',message:'轉換成功',description:'已產生 '+((result.markdown||'').length)+' 字元的 Markdown 內容',showIcon:true}),
        h('div',null,
          h('div',{style:{fontSize:14,fontWeight:600,marginBottom:6,color:'#334155'}},'文件標題'),
          h(Input,{size:'large',value:title,onChange:function(e){setTitle(e.target.value);},placeholder:'輸入文件標題'})
        ),
        h('div',null,
          h('div',{style:{fontSize:14,fontWeight:600,marginBottom:6,color:'#334155'}},'Markdown 預覽（前 600 字）'),
          h('pre',{style:{background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:8,padding:12,fontSize:12,maxHeight:240,overflow:'auto',margin:0,whiteSpace:'pre-wrap',fontFamily:'SF Mono, Monaco, monospace'}},
            (result.markdown || '').slice(0,600) + ((result.markdown||'').length>600?'\n...（省略）':'')
          )
        )
      )
    )
  );
}

// ── TemplateSelectModal ───────────────────────────────────────────────────────
function TemplateSelectModal(props) {
  var open = props.open; var onCancel = props.onCancel; var onSelect = props.onSelect;
  var projectId = props.projectId;
  var client = useAPIClient();
  var _tl = useState([]); var templates = _tl[0]; var setTemplates = _tl[1];
  var _ll = useState(false); var loading = _ll[0]; var setLoading = _ll[1];
  useEffect(function(){
    if(!open)return;
    setLoading(true);
    var params = {};
    if(projectId) params.projectId = projectId;
    client.request({url:'docTemplates:list',method:'get',params:params})
      .then(function(r){var d=r.data&&r.data.data;setTemplates(Array.isArray(d)?d:[]);})
      .catch(function(){setTemplates([]);})
      .finally(function(){setLoading(false);});
  },[open]);
  return h(Modal,{title:'選擇範本',open:open,onCancel:onCancel,footer:null,width:520},
    loading?h('div',{style:{textAlign:'center',padding:40}},h(Spin)):
    templates.length===0?h(Empty,{description:'尚無可用範本，請先至「範本管理」建立範本'}):
    h('div',{style:{display:'flex',flexDirection:'column',gap:10,maxHeight:400,overflowY:'auto'}},
      templates.map(function(tpl){
        return h('div',{key:tpl.id,
          onClick:function(){onSelect(tpl);},
          style:{border:'1px solid #d9d9d9',borderRadius:8,padding:'14px 16px',cursor:'pointer',
            display:'flex',alignItems:'flex-start',gap:12,transition:'all 0.2s',background:'#fafafa'},
          onMouseEnter:function(e){e.currentTarget.style.borderColor='#1677ff';e.currentTarget.style.background='#e6f4ff';},
          onMouseLeave:function(e){e.currentTarget.style.borderColor='#d9d9d9';e.currentTarget.style.background='#fafafa';}
        },
          h('div',{style:{fontSize:24,flexShrink:0}},'📋'),
          h('div',{style:{flex:1,minWidth:0}},
            h('div',{style:{fontWeight:600,fontSize:14,color:'#1a1f26',marginBottom:4}},tpl.name),
            tpl.description&&h('div',{style:{fontSize:12,color:'#8c8c8c'}},tpl.description),
            h('div',{style:{fontSize:11,color:'#bbb',marginTop:4}},(tpl.fields||[]).length+'個欄位')
          )
        );
      })
    )
  );
}

// ── TemplateFillPage ──────────────────────────────────────────────────────────
function TemplateFillPage(){
  var params=useParams();var docId=params.id;
  var navigate=useNavigate();var client=useAPIClient();
  var loc=useLocation();
  // Parse query params
  var qp=new URLSearchParams(loc.search||'');
  var qTemplateId=qp.get('templateId');var qProjectId=qp.get('projectId');var qCatId=qp.get('categoryId');
  var isNew=docId==='new';
  var _dl=useDoc(isNew?null:docId);var doc=_dl.doc;var loading=_dl.loading;
  var _tpl=useState(null);var tpl=_tpl[0];var setTpl=_tpl[1];
  var _fd=useState({});var formData=_fd[0];var setFormData=_fd[1];
  var _sv=useState(false);var saving=_sv[0];var setSaving=_sv[1];
  var _te=useState({});var errors=_te[0];var setErrors=_te[1];
  var _users=useState([]);var userOptions=_users[0];var setUserOptions=_users[1];
  var _title=useState('');var docTitle=_title[0];var setDocTitle=_title[1];
  var _realId=useState(null);var realDocId=_realId[0];var setRealDocId=_realId[1];
  var _docStatus=useState('draft');var docStatus=_docStatus[0];var setDocStatus=_docStatus[1];
  var _tfDirty=useState(false);var tfIsDirty=_tfDirty[0];var setTfIsDirty=_tfDirty[1];

  // Load template for NEW mode
  useEffect(function(){
    if(!isNew||!qTemplateId)return;
    client.request({url:'docTemplates:get',method:'get',params:{filterByTk:qTemplateId}})
      .then(function(r){
        var t=r.data&&r.data.data;
        setTpl(t);
        // Set defaults from template fields
        if(t&&t.fields){
          var defaults={};
          t.fields.forEach(function(f){if(f.defaultValue!==undefined&&f.defaultValue!=='')defaults[f.name]=f.defaultValue;});
          setFormData(defaults);
        }
      })
      .catch(function(){setTpl(null);});
  },[isNew,qTemplateId]);

  // Load template for EDIT mode
  useEffect(function(){
    if(isNew||!doc||!doc.content)return;
    if(doc.status)setDocStatus(doc.status);
    if(isTemplateContent(doc.content)){
      var parsed=parseTemplateContent(doc.content);
      if(!parsed)return;
      setFormData(parsed.data||{});
      if(parsed.templateId){
        client.request({url:'docTemplates:get',method:'get',params:{filterByTk:parsed.templateId}})
          .then(function(r){setTpl((r.data&&r.data.data)||null);})
          .catch(function(){setTpl(null);});
      }
    }
  },[doc]);

  useEffect(function(){
    if(!tpl)return;
    var hasUser=(tpl.fields||[]).some(function(f){return f.type==='user';});
    if(!hasUser)return;
    client.request({url:'users:list',method:'get',params:{pageSize:200}})
      .then(function(r){var list=r.data&&r.data.data||[];setUserOptions(list.map(function(u){return {label:u.nickname||u.username||u.email,value:u.id};}));})
      .catch(function(){});
  },[tpl]);

  function handleSave(){
    if(!tpl)return;
    if(isNew&&!docTitle.trim()){message.error('請輸入文件標題');return;}
    var errs={};
    (tpl.fields||[]).forEach(function(f){
      if(f.required&&!formData[f.name]&&formData[f.name]!==0){
        errs[f.name]='此欄位為必填';
      }
    });
    if(Object.keys(errs).length>0){setErrors(errs);message.error('請填寫必填欄位');return;}
    setSaving(true);
    var req;
    if(isNew){
      req=client.request({url:'docDocuments:create',method:'post',data:{
        title:docTitle.trim(),
        contentType:'template',templateId:Number(qTemplateId),formData:formData,
        projectId:qProjectId?Number(qProjectId):null,
        categoryId:qCatId?Number(qCatId):null,
        status:docStatus,
      }});
    } else {
      req=client.request({url:'docDocuments:update',method:'post',params:{filterByTk:docId},data:{formData:formData,status:docStatus}});
    }
    req.then(function(r){
      message.success('儲存成功');
      setTfIsDirty(false);
      var savedId=isNew?(r.data&&(r.data.id||(r.data.data&&r.data.data.id))):docId;
      if(savedId||docId){
        navigate('/admin/doc-hub/view/'+(savedId||docId));
      } else {
        var qs='';if(qProjectId)qs+='?projectId='+qProjectId;if(qCatId)qs+=(qs?'&':'?')+'categoryId='+qCatId;
        navigate('/admin/doc-hub'+qs);
      }
    }).catch(function(e){message.error('儲存失敗');})
    .finally(function(){setSaving(false);});
  }

  useEffect(function(){
    function beforeUnload(e){if(!tfIsDirty||saving)return;e.preventDefault();e.returnValue='';return '';}
    window.addEventListener('beforeunload',beforeUnload);
    return function(){window.removeEventListener('beforeunload',beforeUnload);};
  },[tfIsDirty,saving]);

  function updateFormData(updater){setFormData(updater);setTfIsDirty(true);}

  function renderField(field){
    var value=formData[field.name];
    var err=errors[field.name];
    var borderColor=err?'#ff4d4f':'#d9d9d9';
    var labelEl=h('div',{style:{fontWeight:600,fontSize:13,color:err?'#ff4d4f':'#1a1f26',marginBottom:4}},
      field.label,field.required&&h('span',{style:{color:'#ff4d4f',marginLeft:2}},'*')
    );
    var inputEl;
    if(field.type==='text'){
      inputEl=h(Input,{value:value||'',placeholder:field.placeholder||'',
        style:{borderColor:borderColor},
        onChange:function(e){updateFormData(function(p){var n=Object.assign({},p);n[field.name]=e.target.value;return n;});setErrors(function(p){var n=Object.assign({},p);delete n[field.name];return n;});}
      });
    } else if(field.type==='textarea'){
      inputEl=h(Input.TextArea,{value:value||'',placeholder:field.placeholder||'',rows:4,
        style:{borderColor:borderColor},
        onChange:function(e){updateFormData(function(p){var n=Object.assign({},p);n[field.name]=e.target.value;return n;});setErrors(function(p){var n=Object.assign({},p);delete n[field.name];return n;});}
      });
    } else if(field.type==='date'){
      inputEl=h(Input,{type:'date',value:value||'',
        style:{borderColor:borderColor},
        onChange:function(e){updateFormData(function(p){var n=Object.assign({},p);n[field.name]=e.target.value;return n;});setErrors(function(p){var n=Object.assign({},p);delete n[field.name];return n;});}
      });
    } else if(field.type==='select'){
      inputEl=h(Select,{value:value||undefined,style:{width:'100%',borderColor:borderColor},
        placeholder:'請選擇',allowClear:true,
        options:(field.options||[]),
        onChange:function(v){updateFormData(function(p){var n=Object.assign({},p);n[field.name]=v;return n;});setErrors(function(p){var n=Object.assign({},p);delete n[field.name];return n;});}
      });
    } else if(field.type==='multiselect'){
      inputEl=h(Select,{mode:'multiple',value:value||[],style:{width:'100%'},
        placeholder:'請選擇（可多選）',allowClear:true,
        options:(field.options||[]),
        onChange:function(v){updateFormData(function(p){var n=Object.assign({},p);n[field.name]=v;return n;});setErrors(function(p){var n=Object.assign({},p);delete n[field.name];return n;});}
      });
    } else if(field.type==='user'){
      inputEl=h(Select,{value:value||undefined,style:{width:'100%'},
        placeholder:'選擇用戶',allowClear:true,showSearch:true,
        options:userOptions,
        filterOption:function(input,option){return (option.label||'').toLowerCase().includes(input.toLowerCase());},
        onChange:function(v){updateFormData(function(p){var n=Object.assign({},p);n[field.name]=v;return n;});setErrors(function(p){var n=Object.assign({},p);delete n[field.name];return n;});}
      });
    } else {
      inputEl=h(Input,{value:value||'',onChange:function(e){updateFormData(function(p){var n=Object.assign({},p);n[field.name]=e.target.value;return n;});}});
    }
    return h('div',{key:field.id||field.name,style:{marginBottom:20}},
      labelEl,inputEl,
      err&&h('div',{style:{color:'#ff4d4f',fontSize:12,marginTop:2}},err)
    );
  }

  if(!isNew&&loading)return h('div',{style:{textAlign:'center',padding:80}},h(Spin));

  var backTarget=isNew?'/admin/doc-hub':(realDocId||docId)?'/admin/doc-hub/view/'+(realDocId||docId):'/admin/doc-hub';

  return h('div',{style:{minHeight:'100vh',background:'#f5f7fa',display:'flex',flexDirection:'column'}},
    h('div',{style:{background:'#fff',borderBottom:'1px solid #f0f0f0',padding:'12px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10}},
      h(Space,null,
        h(Button,{icon:h(ArrowLeftOutlined),onClick:function(){navigate(backTarget);}},'返回'),
        h('span',{style:{fontWeight:600,fontSize:16}},isNew?'新增文件（表單）':(doc?doc.title:'填寫表單')),
        tpl&&h(Tag,{color:'blue'},'📋 '+tpl.name)
      ),
      h(Button,{type:'primary',loading:saving,onClick:handleSave},'儲存')
    ),
    h('div',{style:{maxWidth:720,width:'100%',margin:'40px auto',padding:'0 24px'}},
      !tpl&&!loading&&h(Alert,{type:'warning',message:'找不到對應的範本定義',description:'範本可能已被刪除，欄位定義無法載入。',style:{marginBottom:24}}),
      tpl&&h('div',{style:{background:'#fff',borderRadius:12,padding:'32px',boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}},
        h('h2',{style:{fontSize:20,fontWeight:700,color:'#1a1f26',marginBottom:4,marginTop:0}},tpl.name),
        tpl.description&&h('p',{style:{color:'#8c8c8c',fontSize:13,marginBottom:24,marginTop:4}},tpl.description),
        h(Divider,{style:{margin:'16px 0'}}),
        h('div',{style:{marginBottom:20,display:'flex',gap:12,alignItems:'flex-end'}},
          h('div',{style:{flex:1}},
            isNew&&h('div',null,
              h('div',{style:{fontWeight:600,fontSize:13,color:'#1a1f26',marginBottom:4}},'文件標題 ',h('span',{style:{color:'#ff4d4f'}},'*')),
              h(Input,{value:docTitle,placeholder:'請輸入文件標題',onChange:function(e){setDocTitle(e.target.value);}})
            )
          ),
          h('div',{style:{flexShrink:0}},
            h('div',{style:{fontWeight:600,fontSize:13,color:'#1a1f26',marginBottom:4}},'狀態'),
            h(Select,{value:docStatus,onChange:function(v){setDocStatus(v);},style:{width:130},
              options:[
                {label:'○ 草稿',value:'draft'},
                {label:'● 已發布',value:'published'}
              ]})
          )
        ),
        (tpl.fields||[]).map(function(field){return renderField(field);}),
        h('div',{style:{textAlign:'right',marginTop:24}},
          h(Button,{onClick:function(){navigate(backTarget);},style:{marginRight:12}},'取消'),
          h(Button,{type:'primary',loading:saving,onClick:handleSave},'儲存')
        )
      )
    )
  );
}

// ── TemplateFormViewer ────────────────────────────────────────────────────────
function TemplateFormViewer(props) {
  var doc = props.doc; var tpl = props.tpl;
  var parsed = doc&&doc.content?parseTemplateContent(doc.content):null;
  if(!parsed)return h('div',{style:{color:'#bbb',textAlign:'center',padding:40}},'（無法解析表單內容）');
  var data = parsed.data||{};
  // 優先用 tpl.fields（最新），fallback 用 parsed.fields（儲存時的快照），避免範本更新/刪除後損壞
  var fields = (tpl&&tpl.fields&&tpl.fields.length>0)?tpl.fields:(parsed.fields||[]);
  // Fallback: if no template, just render key-value
  if(!fields||fields.length===0){
    return h('div',{style:{background:'#fff',borderRadius:12,padding:32,boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}},
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px 32px'}},
        Object.keys(data).map(function(k){
          return h('div',{key:k},
            h('div',{style:{fontSize:12,color:'#8c8c8c',marginBottom:2}},k),
            h('div',{style:{fontSize:14,color:'#1a1f26',fontWeight:500}},String(data[k]||'-'))
          );
        })
      )
    );
  }
  return h('div',{style:{background:'#fff',borderRadius:12,padding:32,boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}},
    h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px 32px'}},
      fields.map(function(field){
        var val=data[field.name];
        var displayVal='-';
        if(val!==undefined&&val!==null&&val!==''){
          // select/multiselect：把 value 轉成對應 label
          var optMap={};
          (field.options||[]).forEach(function(o){
            if(o&&typeof o==='object'){optMap[o.value]=o.label;}
            else if(typeof o==='string'){optMap[o]=o;}
          });
          if(field.type==='multiselect'||Array.isArray(val)){
            var arr=Array.isArray(val)?val:[val];
            displayVal=arr.map(function(v){return optMap[v]||v;}).join('、')||'-';
          } else if(field.type==='select'){
            displayVal=optMap[val]||String(val);
          } else if(field.type==='date'){
            displayVal=val;
          } else {
            displayVal=String(val);
          }
        }
        var isWide=field.type==='textarea';
        return h('div',{key:field.id||field.name,style:{gridColumn:isWide?'1 / -1':'auto'}},
          h('div',{style:{fontSize:12,color:'#8c8c8c',marginBottom:4,fontWeight:500}},field.label),
          h('div',{style:{fontSize:14,color:'#1a1f26',lineHeight:1.6,whiteSpace:'pre-wrap',
            background:'#f7f8fa',borderRadius:6,padding:'8px 12px',minHeight:32}},displayVal)
        );
      })
    )
  );
}

// ── TemplateBuilderModal ──────────────────────────────────────────────────────
var FIELD_TYPES=[
  {label:'文字（單行）',value:'text'},
  {label:'文字（多行）',value:'textarea'},
  {label:'日期',value:'date'},
  {label:'單選',value:'select'},
  {label:'多選',value:'multiselect'},
  {label:'用戶',value:'user'},
];

function TemplateBuilderModal(props){
  var open=props.open;var onCancel=props.onCancel;var onSave=props.onSave;
  var initial=props.template;var projectId=props.projectId;
  var client=useAPIClient();
  var _nm=useState('');var name=_nm[0];var setName=_nm[1];
  var _dc=useState('');var desc=_dc[0];var setDesc=_dc[1];
  var _fl=useState([]);var fields=_fl[0];var setFields=_fl[1];
  var _ldf=useState([]);var listDisplayFields=_ldf[0];var setListDisplayFields=_ldf[1];
  var _md=useState('visual');var mode=_md[0];var setMode=_md[1]; // 'visual' | 'json'
  var _json=useState('');var jsonText=_json[0];var setJsonText=_json[1];
  var _jsonErr=useState('');var jsonErr=_jsonErr[0];var setJsonErr=_jsonErr[1];
  var _sv=useState(false);var saving=_sv[0];var setSaving=_sv[1];
  var _cats=useState([]);var cats=_cats[0];var setCats=_cats[1];
  var _catId=useState(null);var defaultCatId=_catId[0];var setDefaultCatId=_catId[1];
  var _drag=useState(null);var dragIdx=_drag[0];var setDragIdx=_drag[1];

  useEffect(function(){
    if(!open)return;
    if(initial){
      setName(initial.name||'');
      setDesc(initial.description||'');
      setFields(initial.fields||[]);
      setListDisplayFields(initial.listDisplayFields||[]);
      setDefaultCatId(initial.defaultCategoryId||null);
    } else {
      setName('');setDesc('');setFields([]);setListDisplayFields([]);setDefaultCatId(null);
    }
    setMode('visual');setJsonText('');setJsonErr('');
    // Load categories
    client.request({url:'docCategories:list',method:'get',params:projectId?{projectId:projectId}:{}})
      .then(function(r){var list=r.data&&r.data.data||[];setCats(list);})
      .catch(function(){setCats([]);});
  },[open,initial]);

  function switchToJson(){
    setJsonText(JSON.stringify(fields,null,2));
    setJsonErr('');
    setMode('json');
  }
  function switchToVisual(){
    try{
      var parsed=JSON.parse(jsonText);
      if(!Array.isArray(parsed)){setJsonErr('必須是陣列格式 [...]');return;}
      setFields(parsed);setJsonErr('');setMode('visual');
    }catch(e){setJsonErr('JSON 格式有誤：'+e.message);}
  }

  function addField(){
    setFields(function(prev){
      return prev.concat([{id:genFieldId(),type:'text',label:'',name:'',required:false,defaultValue:'',options:[]}]);
    });
  }
  function removeField(idx){
    setFields(function(prev){return prev.filter(function(_,i){return i!==idx;});});
  }
  function updateField(idx,key,val){
    setFields(function(prev){
      return prev.map(function(f,i){
        if(i!==idx)return f;
        var nf=Object.assign({},f);
        nf[key]=val;
        if(key==='label'&&!f._nameEdited){nf.name=labelToName(val);}
        return nf;
      });
    });
  }
  function updateFieldName(idx,val){
    setFields(function(prev){
      return prev.map(function(f,i){
        if(i!==idx)return f;
        return Object.assign({},f,{name:val,_nameEdited:true});
      });
    });
  }

  function handleDragStart(e,idx){setDragIdx(idx);}
  function handleDragOver(e,idx){e.preventDefault();}
  function handleDrop(e,idx){
    e.preventDefault();
    if(dragIdx===null||dragIdx===idx)return;
    setFields(function(prev){
      var arr=prev.slice();
      var item=arr.splice(dragIdx,1)[0];
      arr.splice(idx,0,item);
      return arr;
    });
    setDragIdx(null);
  }

  function handleSave(){
    if(!name.trim()){message.error('請填寫範本名稱');return;}
    var finalFields=mode==='json'?JSON.parse(jsonText||'[]'):fields;
    for(var i=0;i<finalFields.length;i++){
      var f=finalFields[i];
      if(!f.label||!f.label.trim()){message.error('第'+(i+1)+'個欄位的標籤不能為空');return;}
      if(!f.name){f.name=labelToName(f.label);}
    }
    setSaving(true);
    var payload={
      name:name.trim(),description:desc,
      fields:finalFields,listDisplayFields:listDisplayFields,
      defaultCategoryId:defaultCatId,projectId:projectId||null,
    };
    var req;
    if(initial&&initial.id){
      req=client.request({url:'docTemplates:update',method:'post',params:{filterByTk:initial.id},data:payload});
    } else {
      req=client.request({url:'docTemplates:create',method:'post',data:payload});
    }
    req.then(function(r){
      message.success(initial?'範本已更新':'範本已建立');
      onSave(r.data&&r.data.data||r.data);
    }).catch(function(e){
      message.error((e.response&&e.response.data&&e.response.data.errors&&e.response.data.errors[0]&&e.response.data.errors[0].message)||'儲存失敗');
    }).finally(function(){setSaving(false);});
  }

  function renderOptionsEditor(field,idx){
    if(field.type!=='select'&&field.type!=='multiselect')return null;
    var opts=field.options||[];
    return h('div',{style:{marginTop:8}},
      h('div',{style:{fontSize:12,color:'#8c8c8c',marginBottom:4}},'選項（每行一個，格式：顯示文字 或 顯示文字=value）'),
      h(Input.TextArea,{
        value:opts.map(function(o){return o.label===o.value?o.label:o.label+'='+o.value;}).join('\n'),
        rows:3,
        placeholder:'例如：\n開發=dev\n測試=staging\n正式=prod',
        onChange:function(e){
          var lines=e.target.value.split('\n').filter(function(l){return l.trim();});
          var newOpts=lines.map(function(l){
            var eq=l.indexOf('=');
            if(eq>-1){return {label:l.slice(0,eq).trim(),value:l.slice(eq+1).trim()};}
            return {label:l.trim(),value:l.trim()};
          });
          updateField(idx,'options',newOpts);
        }
      })
    );
  }

  return h(Modal,{
    title:(initial?'編輯範本：':'建立範本')+(initial?initial.name:''),
    open:open,onCancel:onCancel,
    width:800,
    footer:[
      h(Button,{key:'cancel',onClick:onCancel},'取消'),
      h(Button,{key:'save',type:'primary',loading:saving,onClick:handleSave},initial?'更新':'建立')
    ]
  },
    h('div',{style:{display:'flex',flexDirection:'column',gap:16}},
      // Basic info
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
        h('div',null,
          h('div',{style:{fontSize:13,fontWeight:600,marginBottom:4}},'範本名稱 ',h('span',{style:{color:'red'}},'*')),
          h(Input,{value:name,placeholder:'例如：上版單、需求單',onChange:function(e){setName(e.target.value);}})
        ),
        h('div',null,
          h('div',{style:{fontSize:13,fontWeight:600,marginBottom:4}},'預設資料夾'),
          h(Select,{value:defaultCatId||undefined,style:{width:'100%'},placeholder:'不指定',allowClear:true,
            options:cats.map(function(c){return {label:c.name,value:c.id};}),
            onChange:function(v){setDefaultCatId(v||null);}
          })
        )
      ),
      h('div',null,
        h('div',{style:{fontSize:13,fontWeight:600,marginBottom:4}},'說明'),
        h(Input,{value:desc,placeholder:'範本用途說明（選填）',onChange:function(e){setDesc(e.target.value);}})
      ),
      h(Divider,{style:{margin:'8px 0'}}),
      // Mode toggle
      h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}},
        h('div',{style:{fontWeight:600,fontSize:14}},'欄位定義'),
        h('div',{style:{display:'flex',gap:8}},
          mode==='visual'
            ?h(Button,{size:'small',onClick:switchToJson},'切換 JSON 模式')
            :h(Button,{size:'small',onClick:switchToVisual},'切換視覺模式')
        )
      ),
      // Visual mode
      mode==='visual'&&h('div',null,
        fields.length===0&&h('div',{style:{textAlign:'center',color:'#bbb',padding:'24px 0',border:'1px dashed #d9d9d9',borderRadius:8}},'尚未新增欄位'),
        fields.map(function(field,idx){
          return h('div',{
            key:field.id||idx,
            draggable:true,
            onDragStart:function(e){handleDragStart(e,idx);},
            onDragOver:function(e){handleDragOver(e,idx);},
            onDrop:function(e){handleDrop(e,idx);},
            style:{border:'1px solid #e8e8e8',borderRadius:8,padding:16,marginBottom:8,background:'#fafafa',cursor:'grab',
              opacity:dragIdx===idx?0.4:1}
          },
            h('div',{style:{display:'flex',gap:8,flexWrap:'wrap',alignItems:'flex-start'}},
              h('div',{style:{fontSize:16,cursor:'grab',color:'#bbb',paddingTop:6,flexShrink:0}},'⠿'),
              h('div',{style:{flex:1,minWidth:0}},
                h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr auto',gap:8,alignItems:'flex-end'}},
                  h('div',null,
                    h('div',{style:{fontSize:12,color:'#8c8c8c',marginBottom:2}},'標籤（顯示名稱）'),
                    h(Input,{size:'small',value:field.label,placeholder:'例：版本號',onChange:function(e){updateField(idx,'label',e.target.value);}})
                  ),
                  h('div',null,
                    h('div',{style:{fontSize:12,color:'#8c8c8c',marginBottom:2}},'系統名稱'),
                    h(Input,{size:'small',value:field.name,placeholder:'自動產生',onChange:function(e){updateFieldName(idx,e.target.value);}})
                  ),
                  h('div',null,
                    h('div',{style:{fontSize:12,color:'#8c8c8c',marginBottom:2}},'欄位類型'),
                    h(Select,{size:'small',value:field.type,style:{width:'100%'},
                      options:FIELD_TYPES,
                      onChange:function(v){updateField(idx,'type',v);}
                    })
                  ),
                  h('div',{style:{display:'flex',gap:4,paddingBottom:0}},
                    h(Button,{size:'small',danger:true,onClick:function(){removeField(idx);}},h(DeleteOutlined))
                  )
                ),
                h('div',{style:{display:'flex',gap:16,marginTop:8,alignItems:'center'}},
                  h('label',{style:{display:'flex',alignItems:'center',gap:4,fontSize:12,cursor:'pointer'}},
                    h('input',{type:'checkbox',checked:!!field.required,onChange:function(e){updateField(idx,'required',e.target.checked);}}),
                    '必填'
                  ),
                  field.type!=='select'&&field.type!=='multiselect'&&field.type!=='user'&&h('div',{style:{flex:1}},
                    h('div',{style:{fontSize:12,color:'#8c8c8c',marginBottom:2}},'預設值'),
                    h(Input,{size:'small',value:field.defaultValue||'',placeholder:'（選填）',onChange:function(e){updateField(idx,'defaultValue',e.target.value);}})
                  )
                ),
                renderOptionsEditor(field,idx)
              )
            )
          );
        }),
        h(Button,{type:'dashed',style:{width:'100%',marginTop:8},icon:h(PlusOutlined),onClick:addField},'新增欄位')
      ),
      // JSON mode
      mode==='json'&&h('div',null,
        h(Input.TextArea,{
          value:jsonText,rows:16,
          style:{fontFamily:'monospace',fontSize:12,borderColor:jsonErr?'#ff4d4f':'#d9d9d9'},
          onChange:function(e){setJsonText(e.target.value);setJsonErr('');}
        }),
        jsonErr&&h('div',{style:{color:'#ff4d4f',fontSize:12,marginTop:4}},jsonErr)
      ),
      h(Divider,{style:{margin:'8px 0'}}),
      // List display fields
      h('div',null,
        h('div',{style:{fontWeight:600,fontSize:14,marginBottom:4}},'列表摘要欄位'),
        h('div',{style:{fontSize:12,color:'#8c8c8c',marginBottom:8}},'勾選要在文件列表中顯示的欄位（最多4個）'),
        h('div',{style:{display:'flex',gap:12,flexWrap:'wrap'}},
          fields.map(function(field){
            var checked=(listDisplayFields||[]).includes(field.name);
            return h('label',{key:field.name,style:{display:'flex',alignItems:'center',gap:4,fontSize:13,cursor:'pointer',padding:'4px 8px',border:'1px solid '+(checked?'#1677ff':'#d9d9d9'),borderRadius:4,background:checked?'#e6f4ff':'#fff'}},
              h('input',{type:'checkbox',checked:checked,onChange:function(e){
                setListDisplayFields(function(prev){
                  if(e.target.checked){
                    if((prev||[]).length>=4){message.warning('最多選擇4個摘要欄位');return prev;}
                    return (prev||[]).concat([field.name]);
                  } else {
                    return (prev||[]).filter(function(n){return n!==field.name;});
                  }
                });
              }}),
              field.label||field.name
            );
          })
        )
      )
    )
  );
}

// ── TemplateListPage ──────────────────────────────────────────────────────────
function TemplateListPage(){
  var navigate=useNavigate();var client=useAPIClient();
  var currentUser=useCurrentUser();
  var _tl=useState([]);var templates=_tl[0];var setTemplates=_tl[1];
  var _ll=useState(false);var loading=_ll[0];var setLoading=_ll[1];
  var _bm=useState(false);var showBuilder=_bm[0];var setShowBuilder=_bm[1];
  var _et=useState(null);var editingTpl=_et[0];var setEditingTpl=_et[1];
  var _del=useState(null);var deletingTpl=_del[0];var setDeletingTpl=_del[1];
  var _dls=useState(false);var deleting=_dls[0];var setDeleting=_dls[1];
  var _proj=useState([]);var projects=_proj[0];var setProjects=_proj[1];
  var _selProj=useState(null);var selectedProj=_selProj[0];var setSelectedProj=_selProj[1];
  var isAdminUser=!!(currentUser&&(Number(currentUser.id)===1||(currentUser.roles&&currentUser.roles.some(function(r){return r.name==='root'||r.name==='admin';}))));

  function loadTemplates(){
    setLoading(true);
    var params={};if(selectedProj)params.projectId=selectedProj;
    client.request({url:'docTemplates:list',method:'get',params:params})
      .then(function(r){var d=r.data&&r.data.data;var arr=Array.isArray(d)?d:[];setTemplates(arr);})
      .catch(function(e){console.error('[TemplateListPage] loadTemplates error:',e);message.error('載入範本失敗');setTemplates([]);})
      .finally(function(){setLoading(false);});
  }
  useEffect(function(){
    client.request({url:'docProjects:list',method:'get',params:{pageSize:100}})
      .then(function(r){setProjects(r.data&&r.data.data||[]);})
      .catch(function(){});
  },[]);
  useEffect(function(){loadTemplates();},[selectedProj]);

  function handleDelete(){
    if(!deletingTpl)return;
    setDeleting(true);
    client.request({url:'docTemplates:destroy',method:'post',params:{filterByTk:deletingTpl.id}})
      .then(function(){message.success('範本已刪除');setDeletingTpl(null);loadTemplates();})
      .catch(function(){message.error('刪除失敗');})
      .finally(function(){setDeleting(false);});
  }

  var columns=[
    {title:'名稱',dataIndex:'name',key:'name',render:function(v,rec){
      return h('div',null,
        h('div',{style:{fontWeight:600,fontSize:14}},v),
        rec.description&&h('div',{style:{fontSize:12,color:'#8c8c8c'}},rec.description)
      );
    }},
    {title:'欄位數',dataIndex:'fields',key:'fields',width:80,render:function(v){return (v||[]).length;}},
    {title:'狀態',dataIndex:'status',key:'status',width:80,render:function(v){return h(Tag,{color:v==='active'?'green':'default'},v==='active'?'啟用':'已封存');}},
    {title:'建立時間',dataIndex:'createdAt',key:'createdAt',width:160,render:function(v){return v?new Date(v).toLocaleString('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):''}},
    isAdminUser&&{title:'操作',key:'actions',width:140,render:function(v,rec){
      return h(Space,null,
        h(Button,{size:'small',icon:h(EditOutlined),onClick:function(){setEditingTpl(rec);setShowBuilder(true);}},'編輯'),
        h(Button,{size:'small',danger:true,icon:h(DeleteOutlined),onClick:function(){setDeletingTpl(rec);}},'刪除')
      );
    }},
  ].filter(Boolean);

  return h('div',{style:{minHeight:'100vh',background:'#f5f7fa',display:'flex',flexDirection:'column'}},
    h('div',{style:{background:'#fff',borderBottom:'1px solid #f0f0f0',padding:'12px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10}},
      h(Space,null,
        h(Button,{icon:h(ArrowLeftOutlined),onClick:function(){navigate('/admin/doc-hub');}},'返回'),
        h('span',{style:{fontWeight:700,fontSize:18}}, '📋 範本管理')
      ),
      isAdminUser&&h(Button,{type:'primary',icon:h(PlusOutlined),onClick:function(){setEditingTpl(null);setShowBuilder(true);}},'建立範本')
    ),
    h('div',{style:{maxWidth:1100,width:'100%',margin:'32px auto',padding:'0 24px'}},
      h('div',{style:{display:'flex',gap:12,marginBottom:20}},
        h(Select,{value:selectedProj||undefined,placeholder:'篩選專案',allowClear:true,style:{width:200},
          options:(projects||[]).map(function(p){return {label:p.name,value:p.id};}),
          onChange:function(v){setSelectedProj(v||null);}
        })
      ),
      h('div',{style:{background:'#fff',borderRadius:8,boxShadow:'0 1px 3px rgba(0,0,0,0.06)',overflow:'hidden'}},
        loading?h('div',{style:{textAlign:'center',padding:'40px 0'}},h(Spin,null)):
        (templates&&templates.length===0)?h('div',{style:{textAlign:'center',padding:'40px 0',color:'#8c8c8c'}},'尚無範本'):
        h('table',{style:{width:'100%',borderCollapse:'collapse',fontSize:14}},
          h('thead',null,
            h('tr',{style:{background:'#fafafa',borderBottom:'1px solid #f0f0f0'}},
              h('th',{style:{padding:'12px 16px',textAlign:'left',fontWeight:600,color:'rgba(0,0,0,0.88)'}},'名稱'),
              h('th',{style:{padding:'12px 16px',textAlign:'left',fontWeight:600,color:'rgba(0,0,0,0.88)',width:80}},'欄位數'),
              h('th',{style:{padding:'12px 16px',textAlign:'left',fontWeight:600,color:'rgba(0,0,0,0.88)',width:80}},'狀態'),
              h('th',{style:{padding:'12px 16px',textAlign:'left',fontWeight:600,color:'rgba(0,0,0,0.88)',width:160}},'建立時間'),
              isAdminUser&&h('th',{style:{padding:'12px 16px',textAlign:'left',fontWeight:600,color:'rgba(0,0,0,0.88)',width:140}},'操作')
            )
          ),
          h('tbody',null,
            (templates||[]).map(function(rec){
              return h('tr',{key:rec.id,style:{borderBottom:'1px solid #f0f0f0'}},
                h('td',{style:{padding:'12px 16px'}},
                  h('div',null,
                    h('div',{style:{fontWeight:600,fontSize:14}},rec.name),
                    rec.description&&h('div',{style:{fontSize:12,color:'#8c8c8c'}},rec.description)
                  )
                ),
                h('td',{style:{padding:'12px 16px'}},(rec.fields||[]).length),
                h('td',{style:{padding:'12px 16px'}},h(Tag,{color:rec.status==='active'?'green':'default'},rec.status==='active'?'啟用':'已封存')),
                h('td',{style:{padding:'12px 16px'}},rec.createdAt?new Date(rec.createdAt).toLocaleString('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):''),
                isAdminUser&&h('td',{style:{padding:'12px 16px'}},
                  h(Space,null,
                    h(Button,{size:'small',icon:h(EditOutlined),onClick:function(){setEditingTpl(rec);setShowBuilder(true);}},'編輯'),
                    h(Button,{size:'small',danger:true,icon:h(DeleteOutlined),onClick:function(){setDeletingTpl(rec);}},'刪除')
                  )
                )
              );
            })
          )
        )
      )
    ),
    // Builder modal
    showBuilder&&h(TemplateBuilderModal,{
      open:showBuilder,
      onCancel:function(){setShowBuilder(false);setEditingTpl(null);},
      template:editingTpl,
      projectId:selectedProj,
      onSave:function(){setShowBuilder(false);setEditingTpl(null);loadTemplates();}
    }),
    // Delete confirm
    h(Modal,{
      title:'確認刪除',open:!!deletingTpl,
      onCancel:function(){setDeletingTpl(null);},
      onOk:handleDelete,okText:'確認刪除',okButtonProps:{danger:true,loading:deleting},cancelText:'取消'
    },
      deletingTpl&&h('p',null,'確定要刪除範本「',h('strong',null,deletingTpl.name),'」嗎？此操作無法復原。')
    )
  );
}

// ── TagManagerPage ────────────────────────────────────────────────────────────
function TagManagerPage(){
  var navigate=useNavigate();var client=useAPIClient();
  var currentUser=useCurrentUser();
  var _tags=useState([]);var tags=_tags[0];var setTags=_tags[1];
  var _ll=useState(false);var loading=_ll[0];var setLoading=_ll[1];
  var _q=useState('');var q=_q[0];var setQ=_q[1];
  var _ed=useState(null);var editingTag=_ed[0];var setEditingTag=_ed[1];
  var _edName=useState('');var edName=_edName[0];var setEdName=_edName[1];
  var _edColor=useState('');var edColor=_edColor[0];var setEdColor=_edColor[1];
  var _edSaving=useState(false);var edSaving=_edSaving[0];var setEdSaving=_edSaving[1];
  var _del=useState(null);var deletingTag=_del[0];var setDeletingTag=_del[1];
  var _delLoad=useState(false);var deleting=_delLoad[0];var setDeleting=_delLoad[1];
  var _mrg=useState(null);var mergingTag=_mrg[0];var setMergingTag=_mrg[1];
  var _mrgTarget=useState(null);var mergeTargetId=_mrgTarget[0];var setMergeTargetId=_mrgTarget[1];
  var _mrgLoad=useState(false);var merging=_mrgLoad[0];var setMerging=_mrgLoad[1];
  var isAdminUser=!!(currentUser&&(Number(currentUser.id)===1||(currentUser.roles&&currentUser.roles.some(function(r){return r.name==='root'||r.name==='admin';}))));

  function loadTags(){
    setLoading(true);
    client.request({url:'docTags:list',method:'get',params:{pageSize:500,sort:['-usageCount','name']}})
      .then(function(r){setTags((r.data&&r.data.data)||[]);})
      .catch(function(){message.error('載入標籤失敗');setTags([]);})
      .finally(function(){setLoading(false);});
  }
  useEffect(function(){if(client)loadTags();},[client]);

  function openEdit(tag){setEditingTag(tag);setEdName(tag.name||'');setEdColor(tag.color||'');}
  function closeEdit(){setEditingTag(null);setEdName('');setEdColor('');}
  function doSaveEdit(){
    if(!editingTag||!edName.trim()){message.warning('請輸入名稱');return;}
    setEdSaving(true);
    client.request({url:'docTags:update',method:'post',params:{filterByTk:editingTag.id},data:{name:edName.trim(),color:edColor.trim()||null}})
      .then(function(){message.success('已更新');closeEdit();loadTags();})
      .catch(function(err){
        var sm=err&&err.response&&err.response.data&&err.response.data.errors&&err.response.data.errors[0]&&err.response.data.errors[0].message;
        message.error('更新失敗: '+(sm||err&&err.message||'error'));
      })
      .finally(function(){setEdSaving(false);});
  }
  function doDelete(){
    if(!deletingTag)return;
    setDeleting(true);
    client.request({url:'docTags:destroy',method:'post',params:{filterByTk:deletingTag.id}})
      .then(function(){message.success('已刪除');setDeletingTag(null);loadTags();})
      .catch(function(){message.error('刪除失敗');})
      .finally(function(){setDeleting(false);});
  }
  function doMerge(){
    if(!mergingTag||!mergeTargetId){message.warning('請選擇目標標籤');return;}
    setMerging(true);
    client.request({url:'docTags:merge',method:'post',data:{sourceId:mergingTag.id,targetId:mergeTargetId}})
      .then(function(){message.success('已合併');setMergingTag(null);setMergeTargetId(null);loadTags();})
      .catch(function(err){
        var sm=err&&err.response&&err.response.data&&err.response.data.errors&&err.response.data.errors[0]&&err.response.data.errors[0].message;
        message.error('合併失敗: '+(sm||err&&err.message||'error'));
      })
      .finally(function(){setMerging(false);});
  }

  var filtered=q?tags.filter(function(t){return (t.name||'').toLowerCase().indexOf(q.toLowerCase())>=0;}):tags;

  if(!isAdminUser){
    return h('div',{style:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12}},
      h('div',{style:{fontSize:48}},'🔒'),
      h('div',{style:{fontSize:16,color:'#64748b'}},'僅管理員可存取標籤管理'),
      h(Button,{onClick:function(){navigate('/admin/doc-hub');}},'返回列表')
    );
  }

  return h('div',{style:{minHeight:'100vh',background:'#f5f7fa',display:'flex',flexDirection:'column'}},
    h('div',{style:{background:'#fff',borderBottom:'1px solid #f0f0f0',padding:'12px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10}},
      h(Space,null,
        h(Button,{icon:h(ArrowLeftOutlined),onClick:function(){navigate('/admin/doc-hub');}},'返回'),
        h('span',{style:{fontWeight:700,fontSize:18}},'🏷 標籤管理')
      ),
      h(Input,{placeholder:'搜尋標籤…',prefix:h(SearchOutlined),allowClear:true,value:q,onChange:function(e){setQ(e.target.value);},style:{width:220}})
    ),
    h('div',{style:{maxWidth:1100,width:'100%',margin:'32px auto',padding:'0 24px'}},
      h('div',{style:{background:'#fff',borderRadius:8,boxShadow:'0 1px 3px rgba(0,0,0,0.06)',overflow:'hidden'}},
        loading?h('div',{style:{textAlign:'center',padding:'40px 0'}},h(Spin,null)):
        (filtered.length===0)?h('div',{style:{textAlign:'center',padding:'40px 0',color:'#8c8c8c'}},q?'查無符合的標籤':'尚無標籤'):
        h('table',{style:{width:'100%',borderCollapse:'collapse',fontSize:14}},
          h('thead',null,
            h('tr',{style:{background:'#fafafa',borderBottom:'1px solid #f0f0f0'}},
              h('th',{style:{padding:'12px 16px',textAlign:'left',fontWeight:600,width:280}},'標籤'),
              h('th',{style:{padding:'12px 16px',textAlign:'left',fontWeight:600,width:100}},'顏色'),
              h('th',{style:{padding:'12px 16px',textAlign:'left',fontWeight:600,width:120}},'使用次數'),
              h('th',{style:{padding:'12px 16px',textAlign:'left',fontWeight:600,width:160}},'建立時間'),
              h('th',{style:{padding:'12px 16px',textAlign:'left',fontWeight:600,width:260}},'操作')
            )
          ),
          h('tbody',null,
            filtered.map(function(t){
              return h('tr',{key:t.id,style:{borderBottom:'1px solid #f0f0f0'}},
                h('td',{style:{padding:'12px 16px'}},h(Tag,{color:t.color||'default',style:{fontSize:13}},t.name)),
                h('td',{style:{padding:'12px 16px',color:'#64748b',fontFamily:'monospace',fontSize:12}},t.color||'(auto)'),
                h('td',{style:{padding:'12px 16px'}},h('strong',null,t.usageCount||0),' 篇'),
                h('td',{style:{padding:'12px 16px',color:'#64748b',fontSize:13}},t.createdAt?new Date(t.createdAt).toLocaleString('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):''),
                h('td',{style:{padding:'12px 16px'}},
                  h(Space,{size:4},
                    h(Button,{size:'small',icon:h(EditOutlined),onClick:function(){openEdit(t);}},'編輯'),
                    h(Button,{size:'small',icon:h(SwapOutlined),onClick:function(){setMergingTag(t);setMergeTargetId(null);}},'合併'),
                    h(Button,{size:'small',danger:true,icon:h(DeleteOutlined),onClick:function(){setDeletingTag(t);}},'刪除')
                  )
                )
              );
            })
          )
        )
      )
    ),
    // Edit modal
    h(Modal,{title:'編輯標籤',open:!!editingTag,onCancel:closeEdit,
      footer:h(Space,null,
        h(Button,{onClick:closeEdit},'取消'),
        h(Button,{type:'primary',loading:edSaving,onClick:doSaveEdit},'儲存')
      )},
      h('div',{style:{marginBottom:12}},
        h('div',{style:{fontSize:13,fontWeight:600,marginBottom:6}},'名稱'),
        h(Input,{value:edName,onChange:function(e){setEdName(e.target.value);},placeholder:'標籤名稱',autoFocus:true})
      ),
      h('div',null,
        h('div',{style:{fontSize:13,fontWeight:600,marginBottom:6}},'顏色（HEX，留空自動）'),
        h(Input,{value:edColor,onChange:function(e){setEdColor(e.target.value);},placeholder:'#52c41a'}),
        edColor&&h('div',{style:{marginTop:8}},h(Tag,{color:edColor},edName||'預覽'))
      )
    ),
    // Delete modal
    h(Modal,{title:'確認刪除',open:!!deletingTag,
      onCancel:function(){setDeletingTag(null);},
      onOk:doDelete,okText:'確認刪除',okButtonProps:{danger:true,loading:deleting},cancelText:'取消'},
      deletingTag&&h('div',null,
        h('p',null,'確定要刪除標籤「',h('strong',null,deletingTag.name),'」？'),
        (deletingTag.usageCount>0)&&h(Alert,{type:'warning',showIcon:true,message:'此標籤目前被 '+deletingTag.usageCount+' 篇文件使用，刪除後將從這些文件中移除。'})
      )
    ),
    // Merge modal
    h(Modal,{title:'合併標籤',open:!!mergingTag,
      onCancel:function(){setMergingTag(null);setMergeTargetId(null);},
      onOk:doMerge,okText:'確認合併',okButtonProps:{type:'primary',loading:merging},cancelText:'取消'},
      mergingTag&&h('div',null,
        h(Alert,{type:'info',showIcon:true,style:{marginBottom:12},
          message:'合併會將「'+mergingTag.name+'」的所有文件改標為目標標籤，然後刪除「'+mergingTag.name+'」。'}),
        h('div',{style:{fontSize:13,fontWeight:600,marginBottom:6}},'合併到'),
        h(Select,{style:{width:'100%'},placeholder:'選擇目標標籤',value:mergeTargetId||undefined,
          onChange:function(v){setMergeTargetId(v);},
          options:tags.filter(function(x){return x.id!==mergingTag.id;}).map(function(x){return {label:x.name+' ('+(x.usageCount||0)+' 篇)',value:x.id};})})
      )
    )
  );
}

// ── ListPage ─────────────────────────────────────────────────────────────────
function ListPage(){
  var loc=useLocation();
  var _initCtx=(function(){
    var qp=new URLSearchParams(loc.search||'');
    var rawTags=qp.get('tags')||'';
    var tagList=rawTags?rawTags.split(',').map(function(s){return s.trim();}).filter(Boolean):[];
    return {projectId:qp.get('projectId')?Number(qp.get('projectId')):null,categoryId:qp.get('categoryId')?Number(qp.get('categoryId')):null,search:qp.get('q')||'',tags:tagList};
  })();
  var _s=useState(_initCtx.search||'');var search=_s[0];var setSearch=_s[1];
  var _sf=useState('all');var sf=_sf[0];var setSf=_sf[1];
  var _cat=useState(_initCtx.categoryId);var activeCatId=_cat[0];var setActiveCatId=_cat[1];
  var _proj=useState(_initCtx.projectId);var activeProjectId=_proj[0];var setActiveProjectId=_proj[1];
  var _tagFilter=useState(_initCtx.tags||[]);var activeTags=_tagFilter[0];var setActiveTags=_tagFilter[1];
  // ListPage 頂部工具列：熱門標籤 + 最近查看
  var _tt=useState([]);var topTags=_tt[0];var setTopTags=_tt[1];
  var _tl=useState(true);var topTagsLoading=_tl[0];var setTopTagsLoading=_tl[1];
  var _rc=useState([]);var recentDocs=_rc[0];var setRecentDocs=_rc[1];
  var _rcT=useState(0);var recentTick=_rcT[0];var setRecentTick=_rcT[1];
  var _sm=useState(null);var syncDoc=_sm[0];var setSyncDoc=_sm[1];
  var _sy=useState(false);var syncing=_sy[0];var setSyncing=_sy[1];
  var _dd=useState(null);var deleteDoc=_dd[0];var setDeleteDoc=_dd[1];
  var _dy=useState(false);var deleting=_dy[0];var setDeleting=_dy[1];
  // Move doc modal
  var _mv=useState(null);var moveDoc=_mv[0];var setMoveDoc=_mv[1];
  var _mvp=useState(null);var moveTargetProjId=_mvp[0];var setMoveTargetProjId=_mvp[1];
  var _mvc=useState(null);var moveTargetCatId=_mvc[0];var setMoveTargetCatId=_mvc[1];
  var _mvs=useState(false);var moving=_mvs[0];var setMoving=_mvs[1];
  // projects/cats for move modal
  var _mpj=useState([]);var moveProjects=_mpj[0];var setMoveProjects=_mpj[1];
  var _mct=useState([]);var moveCats=_mct[0];var setMoveCats=_mct[1];
  // Lock/unlock doc modal
  var _lk=useState(null);var lockDoc=_lk[0];var setLockDoc=_lk[1]; // null=hidden, {rec, action:'lock'|'unlock'}=open
  var _lks=useState(false);var locking=_lks[0];var setLocking=_lks[1];
  // Info Bar: Delete Project modal
  var _idp=useState(null);var infoDelProj=_idp[0];var setInfoDelProj=_idp[1];
  var _idps=useState(false);var infoDeletingProj=_idps[0];var setInfoDeletingProj=_idps[1];
  // Info Bar: Project Permissions modal
  var _ipp=useState(null);var infoPermProj=_ipp[0];var setInfoPermProj=_ipp[1];
  var _ippv=useState([]);var infoPermViewerIds=_ippv[0];var setInfoPermViewerIds=_ippv[1];
  var _ippe=useState([]);var infoPermEditorIds=_ippe[0];var setInfoPermEditorIds=_ippe[1];
  var _ipps=useState([]);var infoPermSubscriberIds=_ipps[0];var setInfoPermSubscriberIds=_ipps[1];
  var _ippld=useState(false);var infoPermLoading=_ippld[0];var setInfoPermLoading=_ippld[1];
  var _ippsv=useState(false);var infoPermSaving=_ippsv[0];var setInfoPermSaving=_ippsv[1];
  var _ippau=useState([]);var infoPermAllUsers=_ippau[0];var setInfoPermAllUsers=_ippau[1];
  // Project description inline edit
  var _ped=useState(false);var editingProjDesc=_ped[0];var setEditingProjDesc=_ped[1];
  var _pedv=useState('');var projDescDraft=_pedv[0];var setProjDescDraft=_pedv[1];
  var _peds=useState(false);var savingProjDesc=_peds[0];var setSavingProjDesc=_peds[1];
  // Cat: Delete modal
  var _idc=useState(null);var infoDelCat=_idc[0];var setInfoDelCat=_idc[1];
  var _idcs=useState(false);var infoDeletingCat=_idcs[0];var setInfoDeletingCat=_idcs[1];
  // Cat: Permissions modal
  var _icp=useState(null);var infoCatPerm=_icp[0];var setInfoCatPerm=_icp[1];
  var _icpv=useState([]);var infoCatPermViewerIds=_icpv[0];var setInfoCatPermViewerIds=_icpv[1];
  var _icpe=useState([]);var infoCatPermEditorIds=_icpe[0];var setInfoCatPermEditorIds=_icpe[1];
  var _icpo=useState(false);var infoCatPermOverride=_icpo[0];var setInfoCatPermOverride=_icpo[1];
  var _icpld=useState(false);var infoCatPermLoading=_icpld[0];var setInfoCatPermLoading=_icpld[1];
  var _icpsv=useState(false);var infoCatPermSaving=_icpsv[0];var setInfoCatPermSaving=_icpsv[1];
  // Sidebar refresh key（避免 window.location.reload）
  var _sbk=useState(0);var sidebarKey=_sbk[0];var setSidebarKey=_sbk[1];
  function refreshSidebar(){setSidebarKey(function(k){return k+1;});}
  // Sidebar 最近查看折疊
  var _rc=useState(false);var recentCollapsed=_rc[0];var setRecentCollapsed=_rc[1];
  // New Doc modal
  var _ndm=useState(false);var showNewDocModal=_ndm[0];var setShowNewDocModal=_ndm[1];
  var _tsm=useState(false);var showTplSelectModal=_tsm[0];var setShowTplSelectModal=_tsm[1];
  // Import from file modal
  var _ifm=useState(false);var showImportModal=_ifm[0];var setShowImportModal=_ifm[1];
  // Audit Log modal
  var _al=useState(false);var showAuditLog=_al[0];var setShowAuditLog=_al[1];
  var _alData=useState([]);var auditData=_alData[0];var setAuditData=_alData[1];
  var _alLoad=useState(false);var auditLoading=_alLoad[0];var setAuditLoading=_alLoad[1];
  // Audit Log 篩選
  var _alfa=useState('all');var auditActionFilter=_alfa[0];var setAuditActionFilter=_alfa[1];
  var _alfu=useState('');var auditUserFilter=_alfu[0];var setAuditUserFilter=_alfu[1];
  var _alfd=useState('');var auditDateFilter=_alfd[0];var setAuditDateFilter=_alfd[1];
  var _dq=useState('');var debouncedSearch=_dq[0];var setDebouncedSearch=_dq[1];
  useEffect(function(){
    var t=setTimeout(function(){setDebouncedSearch(search.slice(0,200));},400);
    return function(){clearTimeout(t);};
  },[search]);
  useEffect(function(){
    function onCmdK(e){
      var isMac=navigator.platform.toUpperCase().indexOf('MAC')>=0;
      var ctrl=isMac?e.metaKey:e.ctrlKey;
      if(ctrl&&e.key==='k'){
        e.preventDefault();
        var inp=document.querySelector('.dochub-search-input');
        if(inp){inp.focus();inp.select();}
      }
    }
    document.addEventListener('keydown',onCmdK);
    return function(){document.removeEventListener('keydown',onCmdK);};
  },[]);
  // 切換專案/資料夾時重置過濾器
  useEffect(function(){setSf('all');},[activeProjectId,activeCatId]);
  // Sync activeTags from URL changes (navigate triggers loc.search to update)
  useEffect(function(){
    var qp=new URLSearchParams(loc.search||'');
    var rawTags=qp.get('tags')||'';
    var tagList=rawTags?rawTags.split(',').map(function(s){return s.trim();}).filter(Boolean):[];
    setActiveTags(tagList);
  },[loc.search]);
  var _dl=useDocList(debouncedSearch,activeCatId,sf,activeProjectId,activeTags);
  var docs=_dl.data;var loading=_dl.loading;var reload=_dl.reload;
  var client=useAPIClient();
  // 載入當前 project 全部 docs 的 categoryId 計數，給 Folder Tabs 顯示文件數
  var _cdc=useState({});var catDocCounts=_cdc[0];var setCatDocCounts=_cdc[1];
  useEffect(function(){
    if(!client||!activeProjectId){setCatDocCounts({});return;}
    var filter={projectId:activeProjectId};
    client.request({url:'docDocuments:list',method:'get',params:{
      pageSize:500,fields:['id','categoryId'],filter:filter
    }})
      .then(function(r){
        var arr=(r&&r.data&&r.data.data)||[];
        var counts={};
        arr.forEach(function(d){var k=d.categoryId||'_root';counts[k]=(counts[k]||0)+1;});
        setCatDocCounts(counts);
      })
      .catch(function(){setCatDocCounts({});});
  },[client,activeProjectId,docs]);
  // 載入熱門標籤（Top 10）
  useEffect(function(){
    if(!client)return;
    setTopTagsLoading(true);
    client.request({url:'docTags:list',method:'get',params:{pageSize:10,sort:['-usageCount','name']}})
      .then(function(r){setTopTags((r.data&&r.data.data)||[]);})
      .catch(function(){setTopTags([]);})
      .finally(function(){setTopTagsLoading(false);});
  },[client]);
  // 從 localStorage 讀最近查看；recentTick 變化時重讀
  useEffect(function(){
    try{
      var arr=JSON.parse(localStorage.getItem('dochub_recent')||'[]');
      setRecentDocs(Array.isArray(arr)?arr.slice(0,5):[]);
    }catch(e){setRecentDocs([]);}
  },[recentTick,loc.pathname]);
  var navigate=useNavigate();
  var currentUser=useCurrentUser();
  var isAdminUser=!!(currentUser&&(Number(currentUser.id)===1||(currentUser.roles&&currentUser.roles.some(function(r){return r.name==='root'||r.name==='admin';}))));
  var allProjectsList=useOptions('docProjects');
  var allCatsList=useOptions('docCategories');
  var filtered=docs;

  function confirmSync(){
    if(!syncDoc||!client)return;
    setSyncing(true);
    client.request({url:'docDocuments:syncToGit',method:'post',params:{filterByTk:syncDoc.id}})
      .then(function(){message.success('Synced!');setSyncDoc(null);setSyncing(false);reload();})
      .catch(function(err){message.error('Failed: '+(err&&err.message||'error'));setSyncing(false);});
  }
  function confirmDelete(){
    if(!deleteDoc||!client)return;
    setDeleting(true);
    client.request({url:'docDocuments:destroy',method:'delete',params:{filterByTk:deleteDoc.id}})
      .then(function(){message.success('已刪除');setDeleteDoc(null);setDeleting(false);reload();})
      .catch(function(err){message.error('刪除失敗: '+(err&&err.message||'error'));setDeleting(false);});
  }

  function confirmLock(){
    if(!lockDoc||!client)return;
    setLocking(true);
    var action=lockDoc.action==='lock'?'docDocuments:lock':'docDocuments:unlock';
    client.request({url:action,method:'post',params:{filterByTk:lockDoc.rec.id}})
      .then(function(){
        message.success(lockDoc.action==='lock'?'文件已鎖定':'文件已解鎖');
        setLockDoc(null);setLocking(false);reload();
      })
      .catch(function(err){message.error('操作失敗: '+(err&&err.message||'error'));setLocking(false);});
  }

  function doInfoDeleteProject(){
    if(!infoDelProj||!client)return;
    setInfoDeletingProj(true);
    client.request({url:'docProjects:destroy',method:'delete',params:{filterByTk:infoDelProj.id}})
      .then(function(){
        message.success('專案已刪除');
        setInfoDelProj(null);setInfoDeletingProj(false);
        setActiveProjectId(null);setActiveCatId(null);
        refreshSidebar();
      })
      .catch(function(err){message.error('刪除失敗: '+(err&&err.message||'error'));setInfoDeletingProj(false);});
  }

  function openInfoPermModal(proj){
    setInfoPermProj(proj);
    setInfoPermViewerIds([]);setInfoPermEditorIds([]);setInfoPermSubscriberIds([]);setInfoPermLoading(true);
    if(infoPermAllUsers.length===0&&client){
      client.request({url:'users:list',method:'get',params:{pageSize:200}})
        .then(function(res){setInfoPermAllUsers((res.data&&res.data.data)||[]);});
    }
    if(!client)return;
    client.request({url:'docProjects:getPermissions',method:'get',params:{filterByTk:proj.id}})
      .then(function(res){
        var d=res.data&&res.data.data;
        setInfoPermViewerIds((d&&d.viewerIds)||[]);
        setInfoPermEditorIds((d&&d.editorIds)||[]);
        setInfoPermSubscriberIds((d&&d.subscriberIds)||[]);
        setInfoPermLoading(false);
      })
      .catch(function(){setInfoPermLoading(false);});
  }

  function doSaveInfoPermissions(){
    if(!infoPermProj||!client)return;
    setInfoPermSaving(true);
    client.request({url:'docProjects:setPermissions',method:'post',params:{filterByTk:infoPermProj.id},
      data:{viewerIds:infoPermViewerIds,editorIds:infoPermEditorIds,subscriberIds:infoPermSubscriberIds}})
      .then(function(){message.success('專案權限已更新');setInfoPermProj(null);setInfoPermSaving(false);})
      .catch(function(err){message.error('儲存失敗: '+(err&&err.message||'error'));setInfoPermSaving(false);});
  }

  function openInfoCatPermModal(cat){
    setInfoCatPerm(cat);
    setInfoCatPermViewerIds([]);setInfoCatPermEditorIds([]);setInfoCatPermOverride(false);setInfoCatPermLoading(true);
    if(infoPermAllUsers.length===0&&client){
      client.request({url:'users:list',method:'get',params:{pageSize:200}})
        .then(function(res){setInfoPermAllUsers((res.data&&res.data.data)||[]);});
    }
    if(!client)return;
    client.request({url:'docCategories:getPermissions',method:'get',params:{filterByTk:cat.id}})
      .then(function(res){
        var d=res.data&&res.data.data;
        setInfoCatPermOverride(!!(d&&d.overridePermission));
        setInfoCatPermViewerIds((d&&d.viewerIds)||[]);
        setInfoCatPermEditorIds((d&&d.editorIds)||[]);
        setInfoCatPermLoading(false);
      })
      .catch(function(){setInfoCatPermLoading(false);});
  }

  function doSaveInfoCatPermissions(){
    if(!infoCatPerm||!client)return;
    setInfoCatPermSaving(true);
    client.request({url:'docCategories:setPermissions',method:'post',params:{filterByTk:infoCatPerm.id},
      data:{overridePermission:infoCatPermOverride,viewerIds:infoCatPermViewerIds,editorIds:infoCatPermEditorIds}})
      .then(function(){message.success('資料夾權限已更新');setInfoCatPerm(null);setInfoCatPermSaving(false);})
      .catch(function(err){message.error('儲存失敗: '+(err&&err.message||'error'));setInfoCatPermSaving(false);});
  }

  function doInfoDeleteCat(){
    if(!infoDelCat||!client)return;
    setInfoDeletingCat(true);
    client.request({url:'docCategories:destroy',method:'delete',params:{filterByTk:infoDelCat.id}})
      .then(function(){
        message.success('資料夾已刪除');
        setInfoDelCat(null);setInfoDeletingCat(false);
        setActiveCatId(null);
        refreshSidebar();
      })
      .catch(function(err){message.error('刪除失敗: '+(err&&err.message||'error'));setInfoDeletingCat(false);});
  }

  function openAuditLog(){
    setShowAuditLog(true);
    setAuditLoading(true);
    if(!client)return;
    client.request({url:'docAuditLogs:list',method:'get',params:{pageSize:100}})
      .then(function(res){
        var d=res.data&&res.data.data;
        setAuditData(Array.isArray(d)?d:[]);
        setAuditLoading(false);
      })
      .catch(function(){setAuditLoading(false);});
  }

  function openMoveDoc(doc){
    setMoveDoc(doc);
    setMoveTargetProjId(doc.projectId||null);
    setMoveTargetCatId(doc.categoryId||null);
    // 載入專案清單
    if(!client)return;
    client.request({url:'docProjects:list',method:'get',params:{pageSize:100}})
      .then(function(res){setMoveProjects((res.data&&res.data.data)||[]);});
  }

  useEffect(function(){
    if(!moveTargetProjId||!client){setMoveCats([]);return;}
    client.request({url:'docCategories:list',method:'get',params:{pageSize:200,filter:{projectId:moveTargetProjId}}})
      .then(function(res){setMoveCats((res.data&&res.data.data)||[]);});
  },[moveTargetProjId]);

  function doMoveDoc(){
    if(!moveDoc||!client)return;
    if(!moveTargetCatId){message.error('請選擇目標資料夾');return;}
    setMoving(true);
    client.request({url:'docDocuments:update',method:'post',params:{filterByTk:moveDoc.id},
      data:{projectId:moveTargetProjId||null,categoryId:moveTargetCatId||null}})
      .then(function(){message.success('已移動');setMoveDoc(null);setMoving(false);reload();})
      .catch(function(err){message.error('移動失敗: '+(err&&err.message||'error'));setMoving(false);});
  }

  // 欄寬 state（標題欄可拖拉調整）
  var _cw=useState({title:300,category:120,status:90,upd:190,gs:100,actions:155});
  var colWidths=_cw[0];var setColWidths=_cw[1];
  function setColWidth(key,w){setColWidths(function(prev){var n=Object.assign({},prev);n[key]=w;return n;});}

  // 拖曳排序（文件列表，只在非搜尋模式下有效）
  var _dri=useState(null);var dragIdx=_dri[0];var setDragIdx=_dri[1];
  function handleDragStart(index){setDragIdx(index);}
  function handleDrop(targetIndex){
    if(dragIdx===null||dragIdx===targetIndex){setDragIdx(null);return;}
    var newData=Array.from(docs);
    var item=newData.splice(dragIdx,1)[0];
    newData.splice(targetIndex,0,item);
    // 樂觀更新 UI（直接呼叫 reload 會閃），透過改 data 的方式
    // 呼叫 API 儲存新順序
    if(client){
      client.request({url:'docDocuments:reorder',method:'post',data:{ids:newData.map(function(d){return d.id;})}})
        .then(function(){reload();})
        .catch(function(){message.error('排序儲存失敗');reload();});
    }
    setDragIdx(null);
  }

  // 清洗 snippet：把搜尋結果裡殘留的 TEMPLATE_FORM_V1 / JSON 標點轉成可讀文字
  function sanitizeSnippet(text){
    if(!text)return '';
    var s=String(text);
    // 剝掉 TEMPLATE_FORM_V1 前綴
    s=s.replace(/TEMPLATE_FORM_V1\s*/g,'');
    // "key":"value" → key: value
    s=s.replace(/"([^"]+)"\s*:\s*"([^"]*)"/g,'$1: $2 ');
    // "key":value（數字/boolean） → key: value
    s=s.replace(/"([^"]+)"\s*:\s*([^,}\]]+)/g,'$1: $2 ');
    // 剝掉剩下的 JSON 標點
    s=s.replace(/[\{\}\[\]"]/g,' ');
    // 合併多個空白
    s=s.replace(/\s+/g,' ').trim();
    return s;
  }

  // 高亮關鍵字：把 text 裡的 keyword 包上黃底 span，回傳 React 節點陣列
  function highlightText(text, keyword){
    if(!text||!keyword)return text||'';
    var parts=text.split(new RegExp('('+keyword.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'));
    return parts.map(function(p,i){
      return p.toLowerCase()===keyword.toLowerCase()
        ?h('mark',{key:i,style:{background:'#ffe58f',padding:'0 1px',borderRadius:2,color:'#1a1f2b'}},p)
        :p;
    });
  }

  var columns=[
    {title:'標題',dataIndex:'title',key:'title',width:colWidths.title,onHeaderCell:function(col){return{width:col.width,onResize:function(w){setColWidth('title',w);}};},sorter:function(a,b){return (a.title||'').localeCompare(b.title||'','zh-TW');},render:function(text,rec){
      var snippets=rec._snippets||[];
      var keyword=debouncedSearch;
      return h('div',null,
        h('a',{onClick:function(e){e.stopPropagation();navigate('/admin/doc-hub/view/'+rec.id);},style:{fontWeight:500,color:'#1a1f2b',display:'inline-flex',alignItems:'center',gap:4}},
          h(FileTextOutlined,{style:{marginRight:6,color:'#1677ff',flexShrink:0}}),
          keyword?highlightText(text||'-',keyword):text||'-',
          rec.content&&isTemplateContent(rec.content)&&h(Tag,{color:'blue',style:{fontSize:10,padding:'0 4px',margin:0,lineHeight:'16px',flexShrink:0}},'📋 範本')
        ),
        snippets.length>0&&h('div',{style:{marginTop:4}},
          snippets.map(function(s,i){
            return h('div',{key:i,style:{fontSize:14,color:'#73808c',lineHeight:1.6,padding:'2px 0',borderLeft:'2px solid #ffe58f',paddingLeft:8,marginTop:i>0?4:0}},
              highlightText(sanitizeSnippet(s.text),keyword)
            );
          })
        ),
        rec.tags&&rec.tags.length>0&&h('div',{style:{marginTop:4,display:'flex',flexWrap:'wrap',gap:4}},
          rec.tags.map(function(t){
            return h(Tag,{key:t.id,color:t.color||'default',style:{fontSize:11,padding:'0 6px',margin:0,lineHeight:'18px',cursor:'pointer'},
              onClick:function(e){e.stopPropagation();navigate('/admin/doc-hub?tags='+encodeURIComponent(t.name));}},t.name);
          })
        )
      );
    }},
    {title:'資料夾',dataIndex:'category',key:'category',width:colWidths.category,onHeaderCell:function(col){return{width:col.width,onResize:function(w){setColWidth('category',w);}};},sorter:function(a,b){return ((a.category&&a.category.name)||'').localeCompare((b.category&&b.category.name)||'','zh-TW');},render:function(cat){return cat?h(Tag,{color:'geekblue',style:{fontSize:14}},cat.name||'-'):h('span',{style:{color:'#bbb',fontSize:14}},'（無）');}},
    {title:'狀態',dataIndex:'status',key:'status',width:colWidths.status,onHeaderCell:function(col){return{width:col.width,onResize:function(w){setColWidth('status',w);}};},sorter:function(a,b){return (a.status||'').localeCompare(b.status||'');},render:function(s){
      return h(Tag,{color:s==='published'?'green':'orange',style:{fontSize:14}},(s==='published'?'已發布':'草稿'));
    }},
    {title:'最後更新',key:'upd',width:colWidths.upd,onHeaderCell:function(col){return{width:col.width,onResize:function(w){setColWidth('upd',w);}};},defaultSortOrder:'descend',sorter:function(a,b){return new Date(a.updatedAt||0)-new Date(b.updatedAt||0);},render:function(_,rec){
      var name=rec.lastEditor?(rec.lastEditor.nickname||rec.lastEditor.username||rec.lastEditor.email):null;
      var date=rec.updatedAt?new Date(rec.updatedAt).toLocaleString('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'-';
      return h('div',null,
        h('div',{style:{fontSize:15,color:'#1a1f26'}},date),
        name&&h('div',{style:{fontSize:14,color:'#8c99ad',marginTop:2}},h(UserOutlined,{style:{marginRight:3}}),name)
      );
    }},
    hasAnyGitRepo&&{title:'Git 同步',dataIndex:'gitSyncStatus',key:'gs',width:colWidths.gs,onHeaderCell:function(col){return{width:col.width,onResize:function(w){setColWidth('gs',w);}};},render:function(s,rec){return rec.githubRepo?syncBadge(s,rec):null;}},
    {title:'操作',key:'actions',width:90,render:function(_,rec){
      function goEdit(e){e.stopPropagation();navigate('/admin/doc-hub/edit/'+rec.id);}
      function goHistory(){navigate('/admin/doc-hub/versions/'+rec.id);}
      var isRecLocked=!!rec.locked;
      var menuItems=h(Menu,{onClick:function(e){e.domEvent.stopPropagation();}},
        h(Menu.Item,{key:'history',icon:h(HistoryOutlined),onClick:function(){goHistory();}},'版本歷史'),
        h(Menu.Item,{key:'move',icon:h(SwapOutlined),onClick:function(){openMoveDoc(rec);}},'移動'),
        rec.githubRepo&&h(Menu.Item,{key:'sync',icon:h(SyncOutlined),disabled:rec.status!=='published',onClick:function(e){e.domEvent.stopPropagation();setSyncDoc(rec);}},'同步 Git'),
        isAdminUser&&h(Menu.Item,{key:'lock',icon:h('span',null,isRecLocked?'🔓':'🔒'),
          onClick:function(e){e.domEvent.stopPropagation();setLockDoc({rec:rec,action:isRecLocked?'unlock':'lock'});}
        },isRecLocked?'解鎖文件':'鎖定文件'),
        h(Menu.Divider),
        h(Menu.Item,{key:'delete',icon:h(DeleteOutlined),danger:true,disabled:isRecLocked,
          onClick:function(e){e.domEvent.stopPropagation();setDeleteDoc(rec);}
        },isRecLocked?'刪除（已鎖定）':'刪除')
      );
      return h(Space,{size:4},
        h(Tooltip,{title:isRecLocked?'文件已鎖定':null},
          h(Button,{size:'small',icon:h(EditOutlined),title:'編輯',disabled:isRecLocked,onClick:goEdit})
        ),
        h(Dropdown,{overlay:menuItems,trigger:['click']},
          h(Button,{size:'small',onClick:function(e){e.stopPropagation();}},'⋯')
        )
      );
    }}
  ];

  var hasAnyGitRepo=docs.some(function(d){return !!d.githubRepo;});

  return h('div',{style:{display:'flex',minHeight:'100vh',background:'#f5f7fa'}},
    // Sidebar
    h(DocSidebar,{key:sidebarKey,activeCatId:activeCatId,onSelectCat:setActiveCatId,activeProjectId:activeProjectId,onSelectProject:setActiveProjectId,search:search,onSearch:setSearch,onOpenAuditLog:isAdminUser?openAuditLog:null,onOpenTemplates:isAdminUser?function(){navigate('/admin/doc-hub/templates');}:null,onNavigate:navigate,_recentCollapsed:recentCollapsed,_setRecentCollapsed:setRecentCollapsed}),
    // Main content
    h('div',{style:{flex:1,display:'flex',flexDirection:'column',minWidth:0}},
      allProjectsList.length===0&&!loading&&h('div',{style:{
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        padding:'80px 32px',textAlign:'center',flex:1
      }},
        h('div',{style:{fontSize:48,marginBottom:16}},'📂'),
        h('div',{style:{fontSize:22,fontWeight:700,color:'#1a1f26',marginBottom:8}},'歡迎使用 Doc Hub'),
        h('div',{style:{fontSize:15,color:'#73808c',marginBottom:28,maxWidth:420,lineHeight:1.7}},
          '您目前沒有任何專案。請先在左側側欄建立一個專案，然後新增資料夾和文件。'
        ),
        isAdminUser&&h(Button,{type:'primary',size:'large',
          onClick:function(){
            var btn=document.querySelector('[data-dochub-add-project]');
            if(btn){btn.click();}else{message.info('請使用左側側欄的「＋」按鈕新增專案');}
          }
        },'建立第一個專案')
      ),
      // Breadcrumb + title bar
      h('div',{style:{padding:'20px 32px 0'}},
        // 麵包屑：可點段落往上跳（總覽 › 專案 › 父資料夾 › ... › 當前資料夾）
        h('div',{style:{fontSize:15,color:'#73808c',marginBottom:4,display:'flex',alignItems:'center',flexWrap:'wrap',gap:4}},
          (function(){
            var segs=[];
            // 總覽
            segs.push({label:'總覽',onClick:function(){setActiveProjectId(null);setActiveCatId(null);}});
            // 專案
            if(activeProjectId){
              var p=allProjectsList.find(function(x){return x.id===activeProjectId;});
              if(p)segs.push({label:p.name,onClick:function(){setActiveCatId(null);}});
            }
            // 資料夾鏈（從 root 到當前 cat）
            if(activeCatId){
              var chain=[];
              var cur=allCatsList.find(function(x){return x.id===activeCatId;});
              while(cur){
                chain.unshift(cur);
                if(!cur.parentId)break;
                var pid=cur.parentId;
                cur=allCatsList.find(function(x){return x.id===pid;});
              }
              chain.forEach(function(c){
                var cid=c.id;
                segs.push({label:c.name,onClick:function(){setActiveCatId(cid);}});
              });
            }
            var nodes=[];
            segs.forEach(function(s,i){
              var isLast=i===segs.length-1;
              nodes.push(h('span',{key:'s'+i,
                onClick:isLast?undefined:s.onClick,
                style:{cursor:isLast?'default':'pointer',
                  color:isLast?'#1a1f26':'#1677ff',
                  fontWeight:isLast?600:400,
                  transition:'color 0.12s'},
                onMouseEnter:function(e){if(!isLast)e.currentTarget.style.textDecoration='underline';},
                onMouseLeave:function(e){if(!isLast)e.currentTarget.style.textDecoration='none';}
              },s.label));
              if(!isLast)nodes.push(h('span',{key:'sep'+i,style:{color:'#b0bcc8'}},'›'));
            });
            return nodes;
          })()
        ),
        h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:activeProjectId?12:16}},
          h('div',{style:{fontSize:28,fontWeight:700,color:'#1a1f26'}},(function(){
            if(activeCatId){var c=allCatsList.find(function(x){return x.id===activeCatId;});if(c)return c.name;}
            if(activeProjectId){var p=allProjectsList.find(function(x){return x.id===activeProjectId;});if(p)return p.name;}
            return '總覽';
          })()),
          h('div',{style:{display:'flex',alignItems:'center',gap:8}},
            isAdminUser&&activeCatId&&h(Button,{type:'primary',icon:h(PlusOutlined),onClick:function(){setShowNewDocModal(true);}},'新增文件'),
            activeCatId&&isAdminUser&&h(Button,{icon:h(LockOutlined),onClick:function(){
              var cat=allCatsList.find(function(x){return x.id===activeCatId;});
              if(cat)openInfoCatPermModal(cat);
            }},'權限'),
            activeCatId&&isAdminUser&&h(Dropdown,{trigger:['click'],overlay:h(Menu,{onClick:function(info){if(info.key==='del'){var cat=allCatsList.find(function(x){return x.id===activeCatId;});if(cat)setInfoDelCat(cat);}}},h(Menu.Item,{key:'del',danger:true,icon:h(DeleteOutlined)},'刪除資料夾'))},
              h(Button,{icon:h(ExclamationCircleOutlined),style:{color:'#ff4d4f',borderColor:'#ff4d4f'}})
            ),
            !activeCatId&&activeProjectId&&isAdminUser&&h(Button,{icon:h(LockOutlined),onClick:function(){
              var proj=allProjectsList.find(function(x){return x.id===activeProjectId;});
              if(proj)openInfoPermModal(proj);
            }},'權限'),
            !activeCatId&&activeProjectId&&isAdminUser&&h(Dropdown,{trigger:['click'],overlay:h(Menu,{onClick:function(info){if(info.key==='del'){var proj=allProjectsList.find(function(x){return x.id===activeProjectId;});if(proj)setInfoDelProj(proj);}}},h(Menu.Item,{key:'del',danger:true,icon:h(DeleteOutlined)},'刪除專案'))},
              h(Button,{icon:h(ExclamationCircleOutlined),style:{color:'#ff4d4f',borderColor:'#ff4d4f'}})
            )
          )
        ),
        // ── ListPage 頂部工具列（僅「總覽」頁顯示；雙層：[最近查看/管理入口] + [標籤篩選]） ──
        !activeProjectId&&!activeCatId&&(function(){
          var recentAvail=recentDocs&&recentDocs.length>0;
          var recentMenu=recentAvail?h(Menu,null,
            recentDocs.map(function(r){
              var subtitle='';
              if(r.projectId){
                var pp=(allProjectsList||[]).find(function(x){return x.id===r.projectId;});
                if(pp)subtitle=pp.name;
                if(r.categoryId){
                  var cc=(allCatsList||[]).find(function(x){return x.id===r.categoryId;});
                  if(cc)subtitle=(subtitle?subtitle+' / ':'')+cc.name;
                }
              }
              return h(Menu.Item,{key:r.id,onClick:function(){
                navigate('/admin/doc-hub/view/'+r.id+(r.projectId?'?projectId='+r.projectId+(r.categoryId?'&categoryId='+r.categoryId:''):''));
              }},
                h('div',{style:{display:'flex',flexDirection:'column',lineHeight:1.3,padding:'2px 0',maxWidth:280}},
                  h('span',{style:{fontSize:14,color:'#1a1f26',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},r.title||'(無標題)'),
                  subtitle&&h('span',{style:{fontSize:12,color:'#8c8c8c',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},subtitle)
                )
              );
            })
          ):null;
          var selectedNames=activeTags||[];
          function toggleTag(tagName){
            var next=selectedNames.indexOf(tagName)>=0
              ? selectedNames.filter(function(x){return x!==tagName;})
              : selectedNames.concat([tagName]);
            var qp=new URLSearchParams(loc.search||'');
            if(next.length)qp.set('tags',next.join(','));else qp.delete('tags');
            var qs=qp.toString();
            navigate('/admin/doc-hub'+(qs?'?'+qs:''));
          }
          function clearTags(){
            var qp=new URLSearchParams(loc.search||'');
            qp.delete('tags');
            var qs=qp.toString();
            navigate('/admin/doc-hub'+(qs?'?'+qs:''));
          }
          var visibleTags=(topTags||[]).slice(0,8);
          var overflowTags=(topTags||[]).slice(8);
          return h('div',{style:{background:'#fff',border:'1px solid #ebedf0',borderRadius:8,padding:'8px 14px',marginBottom:14}},
            // 第一排：最近查看 + 管理入口
            h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,minHeight:32}},
              h('div',{style:{display:'flex',alignItems:'center',gap:10}},
                recentAvail
                  ? h(Dropdown,{trigger:['click'],overlay:recentMenu},
                      h(Button,{type:'text',size:'small',icon:h(HistoryOutlined),style:{fontSize:13}},
                        '最近查看 ▾'
                      )
                    )
                  : h(Tooltip,{title:'開始查看文件後會顯示在這裡'},
                      h(Button,{type:'text',size:'small',icon:h(HistoryOutlined),disabled:true,style:{fontSize:13}},'最近查看')
                    ),
                h('span',{style:{fontSize:13,color:'#8c8c8c'}},'總覽')
              ),
              isAdminUser&&h('div',{style:{display:'flex',alignItems:'center',gap:4}},
                h(Button,{type:'text',size:'small',icon:h(HistoryOutlined),onClick:openAuditLog,style:{fontSize:13,color:'#5f6b7a'}},'稽核日誌'),
                h(Button,{type:'text',size:'small',icon:h(FileTextOutlined),onClick:function(){navigate('/admin/doc-hub/templates');},style:{fontSize:13,color:'#5f6b7a'}},'範本管理')
              )
            ),
            // 第二排：標籤篩選（loading / 空 / 有資料 三態）
            (topTagsLoading||visibleTags.length>0)&&h('div',{style:{display:'flex',alignItems:'center',gap:10,marginTop:8,paddingTop:8,borderTop:'1px dashed #ebedf0',minHeight:28}},
              h('span',{style:{fontSize:13,color:'#8c8c8c',flexShrink:0}},'標籤'),
              h('div',{style:{flex:1,display:'flex',flexWrap:'wrap',gap:6,overflow:'hidden'}},
                topTagsLoading
                  ? [0,1,2,3,4,5].map(function(i){return h('span',{key:i,style:{width:56,height:22,background:'#f0f2f5',borderRadius:4,display:'inline-block'}});})
                  : visibleTags.map(function(t){
                      var isSelected=selectedNames.indexOf(t.name)>=0;
                      return h(Tag,{
                        key:t.id,
                        color:isSelected?(t.color||'blue'):undefined,
                        style:{fontSize:12,cursor:'pointer',userSelect:'none',margin:0,
                          borderRadius:4,padding:'1px 8px',lineHeight:'20px',
                          background:isSelected?undefined:'#fff',
                          border:isSelected?undefined:'1px solid '+(t.color?'#d9d9d9':'#d9d9d9'),
                          color:isSelected?undefined:'#595959'},
                        title:'使用 '+(t.usageCount||0)+' 次',
                        onClick:function(){toggleTag(t.name);}
                      },t.name);
                    }),
                !topTagsLoading&&overflowTags.length>0&&h(Popover,{
                  trigger:'click',
                  content:h('div',{style:{display:'flex',flexWrap:'wrap',gap:6,maxWidth:320}},
                    overflowTags.map(function(t){
                      var isSelected=selectedNames.indexOf(t.name)>=0;
                      return h(Tag,{key:t.id,
                        color:isSelected?(t.color||'blue'):undefined,
                        style:{fontSize:12,cursor:'pointer',margin:0,borderRadius:4,padding:'1px 8px',lineHeight:'20px'},
                        onClick:function(){toggleTag(t.name);}
                      },t.name);
                    })
                  )},
                  h(Tag,{style:{fontSize:12,cursor:'pointer',margin:0,borderRadius:4,padding:'1px 8px',lineHeight:'20px',background:'#fafafa',border:'1px dashed #d9d9d9',color:'#8c8c8c'}},'+'+overflowTags.length)
                )
              ),
              selectedNames.length>0&&h(Button,{type:'link',size:'small',onClick:clearTags,style:{flexShrink:0,padding:'0 4px',fontSize:12}},'清除 ('+selectedNames.length+')'),
              isAdminUser&&h(Button,{type:'link',size:'small',onClick:function(){navigate('/admin/doc-hub/tags');},style:{flexShrink:0,padding:'0 4px',fontSize:12,color:'#8c8c8c'}},'管理 ›')
            )
          );
        })(),
        // Project Info Bar（選了專案時顯示）
        activeProjectId&&(function(){
          var proj=allProjectsList.find(function(x){return x.id===activeProjectId;});
          if(!proj)return null;
          var docCount=docs.length;
          return h('div',{style:{
            background:'linear-gradient(135deg,#f0f6ff 0%,#f8faff 100%)',
            border:'1px solid #dce8ff',borderRadius:10,
            padding:'16px 22px',marginBottom:16,
            display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16}},
            h('div',{style:{flex:1,minWidth:0}},
              // 描述
              isAdminUser&&editingProjDesc
                ? h('div',{style:{marginBottom:12,display:'flex',gap:8,alignItems:'flex-start'}},
                    h(Input.TextArea,{value:projDescDraft,autoFocus:true,rows:2,size:'large',style:{flex:1},
                      onChange:function(e){setProjDescDraft(e.target.value);},
                      onKeyDown:function(e){if(e.key==='Escape'){setEditingProjDesc(false);}}
                    }),
                    h(Button,{type:'primary',size:'small',loading:savingProjDesc,onClick:function(){
                      setSavingProjDesc(true);
                      client.request({url:'docProjects:update',method:'post',params:{filterByTk:proj.id},data:{description:projDescDraft.trim()}})
                        .then(function(){message.success('描述已更新');setEditingProjDesc(false);setSavingProjDesc(false);refreshSidebar();})
                        .catch(function(err){message.error('儲存失敗');setSavingProjDesc(false);});
                    }},'儲存'),
                    h(Button,{size:'small',onClick:function(){setEditingProjDesc(false);}},'取消')
                  )
                : h('div',{
                    style:{fontSize:15,color:proj.description?'#4a5568':'#b0bcc8',lineHeight:1.7,marginBottom:12,
                      cursor:isAdminUser?'pointer':'default',borderRadius:4,padding:'2px 4px',
                      border:'1px dashed transparent',transition:'border-color 0.15s'},
                    title:isAdminUser?'點擊編輯描述':undefined,
                    onMouseEnter:function(e){if(isAdminUser)e.currentTarget.style.borderColor='#cbd5e1';},
                    onMouseLeave:function(e){e.currentTarget.style.borderColor='transparent';},
                    onClick:function(){if(isAdminUser){setProjDescDraft(proj.description||'');setEditingProjDesc(true);}}
                  },proj.description||(isAdminUser?'點擊新增描述..':'')),
              // Stats row
              h('div',{style:{display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}},
                h('span',{style:{display:'flex',alignItems:'center',gap:6,fontSize:15,color:'#6b7a8d'}},
                  h('span',{style:{fontSize:18}},'📄'),
                  h('strong',{style:{color:'#1a2a3a',fontSize:16}},docCount),
                  '篇文件'
                ),
                proj.githubRepo&&h('span',{style:{display:'flex',alignItems:'center',gap:6,fontSize:15,color:'#6b7a8d'}},
                  h('span',{style:{fontSize:15}},'🔗'),
                  h('a',{href:'https://github.com/'+proj.githubRepo,target:'_blank',
                    style:{color:'#1677ff',textDecoration:'none',fontWeight:500}},
                    proj.githubRepo)
                ),
                proj.updatedAt&&h('span',{style:{fontSize:14,color:'#9aa5b4'}},
                  '最後更新：'+new Date(proj.updatedAt).toLocaleDateString('zh-TW')
                )
              )
            ),
            null
          );
        })(),
        // Folder Tabs（第一行永遠顯示 project 根層第一層；若選中的 cat 還有子資料夾，多顯示一行）
        activeProjectId&&(function(){
          var rootCats=(allCatsList||[]).filter(function(c){
            return String(c.projectId||'')===String(activeProjectId)&&!c.parentId;
          }).slice().sort(function(a,b){
            var sa=a.sort==null?999:a.sort,sb=b.sort==null?999:b.sort;
            if(sa!==sb)return sa-sb;
            return String(a.name||'').localeCompare(String(b.name||''));
          });
          if(!rootCats||rootCats.length===0)return null;
          // 遞迴算每個 cat 的文件數（含所有子孫 cat）
          function countDocsRecursive(catId){
            var total=catDocCounts[catId]||0;
            var children=(allCatsList||[]).filter(function(c){return String(c.parentId||'')===String(catId);});
            children.forEach(function(ch){total+=countDocsRecursive(ch.id);});
            return total;
          }
          var totalCount=Object.keys(catDocCounts).reduce(function(s,k){return s+catDocCounts[k];},0);
          // 找出當前選中的 cat 的「最頂層祖先」與直接子資料夾
          var activeRootCat=null;
          var activeCat=null;
          if(activeCatId){
            activeCat=(allCatsList||[]).find(function(c){return String(c.id)===String(activeCatId);});
            // 往上找到根 cat
            var cur=activeCat;
            while(cur&&cur.parentId){
              cur=(allCatsList||[]).find(function(c){return String(c.id)===String(cur.parentId);});
            }
            activeRootCat=cur;
          }
          var subCats=[];
          if(activeRootCat){
            // 顯示當前選中 cat 的第一層子資料夾（若 activeCatId === root，就是 root 的子；若 activeCatId 是更深層，就用 activeCatId 自己的子）
            var parentForSub=activeCat||activeRootCat;
            subCats=(allCatsList||[]).filter(function(c){
              return String(c.parentId||'')===String(parentForSub.id);
            }).slice().sort(function(a,b){
              var sa=a.sort==null?999:a.sort,sb=b.sort==null?999:b.sort;
              if(sa!==sb)return sa-sb;
              return String(a.name||'').localeCompare(String(b.name||''));
            });
          }
          function renderTab(opts){
            var isActive=opts.active;
            return h('div',{key:opts.key,onClick:opts.onClick,
              style:{cursor:'pointer',padding:'10px 16px',fontSize:14,
                color:isActive?'#1677ff':'#4a5568',
                fontWeight:isActive?600:500,
                borderBottom:isActive?'2px solid #1677ff':'2px solid transparent',
                transition:'all 0.12s',
                display:'flex',alignItems:'center',gap:6,whiteSpace:'nowrap'},
              onMouseEnter:function(e){if(!isActive)e.currentTarget.style.color='#1677ff';},
              onMouseLeave:function(e){if(!isActive)e.currentTarget.style.color='#4a5568';}
            },
              opts.icon&&h('span',null,opts.icon),
              h('span',null,opts.label),
              h('span',{style:{
                background:isActive?'#e6f4ff':'#f0f2f5',
                color:isActive?'#1677ff':'#8c98a6',
                fontSize:12,fontWeight:600,padding:'1px 8px',borderRadius:10,minWidth:22,textAlign:'center'
              }},opts.count!=null?opts.count:'…')
            );
          }
          var rowStyle={display:'flex',alignItems:'center',gap:4,flexWrap:'wrap',padding:'4px 12px'};
          return h('div',{style:{
            marginBottom:14,background:'#fff',border:'1px solid #ebedf0',borderRadius:8
          }},
            // 第一行：root 級資料夾（永不消失）
            h('div',{style:rowStyle},
              renderTab({
                key:'__all__',
                active:!activeCatId,
                label:'全部',
                icon:'📂',
                count:totalCount,
                onClick:function(){setActiveCatId(null);}
              }),
              rootCats.map(function(c){
                return renderTab({
                  key:c.id,
                  active:!!activeRootCat&&String(activeRootCat.id)===String(c.id),
                  label:c.name,
                  icon:'📁',
                  count:countDocsRecursive(c.id),
                  onClick:function(){setActiveCatId(c.id);}
                });
              })
            ),
            null
          );
        })(),
        // Tag filter banner（URL ?tags=... 啟用）
        activeTags&&activeTags.length>0&&h('div',{style:{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'#f0fdfa',border:'1px solid #ccfbf1',borderRadius:6,marginBottom:12,flexWrap:'wrap'}},
          h('span',{style:{fontSize:13,color:'#0d9488',fontWeight:600}},'🏷 標籤篩選：'),
          activeTags.map(function(tn){
            return h(Tag,{key:tn,closable:true,color:'cyan',style:{fontSize:12},
              onClose:function(e){
                e&&e.preventDefault&&e.preventDefault();
                var next=activeTags.filter(function(x){return x!==tn;});
                var qp=new URLSearchParams(loc.search||'');
                if(next.length)qp.set('tags',next.join(','));else qp.delete('tags');
                var qs=qp.toString();
                navigate('/admin/doc-hub'+(qs?'?'+qs:''));
              }},tn);
          }),
          h('a',{style:{fontSize:12,color:'#64748b',cursor:'pointer',textDecoration:'underline'},
            onClick:function(){
              var qp=new URLSearchParams(loc.search||'');
              qp.delete('tags');
              var qs=qp.toString();
              navigate('/admin/doc-hub'+(qs?'?'+qs:''));
            }},'清除全部')
        ),
        // 狀態篩選（取代舊的類型 tabs；計數 + 狀態 Select）
        h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid #ebedf0',padding:'10px 0',marginBottom:0}},
          h('div',{style:{fontSize:14,color:'#73808c'}},
            '共 ',h('span',{style:{fontWeight:600,color:'#1a1f26'}},docs.length),' 筆文件'
          ),
          h(Select,{
            value:sf,size:'small',bordered:false,
            style:{minWidth:90,fontSize:13},
            onChange:function(v){setSf(v);},
            options:[
              {label:'全部狀態',value:'all'},
              {label:'已發布',value:'published'},
              {label:'草稿',value:'draft'}
            ]
          })
        )
      ),
      // Table card
      h('div',{style:{flex:1,padding:'0 32px 32px'}},
        h('div',{style:{background:'#fff',borderRadius:8,boxShadow:'0 1px 3px rgba(0,0,0,0.06)',marginTop:0}},
          h(Table,{dataSource:filtered,columns:columns.filter(Boolean),rowKey:'id',loading:loading,
            components:{header:{cell:ResizableTitle}},
            scroll:{x:'max-content'},
            pagination:{pageSize:20,showTotal:function(t){return '共 '+t+' 篇';}},
            size:'middle',
            locale:{emptyText:h(Empty,{description:'沒有文件'})},
            onChange:function(_p,_f,sorter){
              // 有排序時停用拖曳（避免衝突）
              var sorted=sorter&&sorter.order;
              setDragIdx(sorted?-1:null);
            },
            onRow:(debouncedSearch||dragIdx===-1)?undefined:function(rec,index){
              return {
                draggable:true,
                style:{cursor:'grab'},
                onDragStart:function(e){e.dataTransfer.effectAllowed='move';handleDragStart(index);},
                onDragOver:function(e){e.preventDefault();e.dataTransfer.dropEffect='move';},
                onDrop:function(e){e.preventDefault();handleDrop(index);},
                onDragEnd:function(){setDragIdx(null);}
              };
            }
          })
        )
      )
    ),
    h(GitSyncModal,{visible:!!syncDoc,doc:syncDoc,syncing:syncing,onCancel:function(){setSyncDoc(null);},onConfirm:confirmSync}),
    h(Modal,{title:h('span',null,h(ExclamationCircleOutlined,{style:{color:'#ff4d4f',marginRight:8}}),'確認刪除'),
      open:!!deleteDoc,onCancel:function(){setDeleteDoc(null);},
      footer:h(Space,null,
        h(Button,{onClick:function(){setDeleteDoc(null);}},'取消'),
        h(Button,{type:'primary',danger:true,loading:deleting,onClick:confirmDelete},'確認刪除')
      )},
      deleteDoc&&h('div',null,
        h('p',null,'確定要刪除文件《',h('b',null,deleteDoc.title),'》？'),
        h('p',{style:{color:'#ff4d4f',fontSize:12}},'此操作無法復原，版本歷史也會一併刪除。')
      )
    ),
    h(Modal,{title:h('span',null,h(SwapOutlined,{style:{color:'#1677ff',marginRight:8}}),'移動文件'),
      open:!!moveDoc,onCancel:function(){setMoveDoc(null);},
      footer:h(Space,null,
        h(Button,{onClick:function(){setMoveDoc(null);}},'取消'),
        h(Button,{type:'primary',loading:moving,onClick:doMoveDoc},'確認移動')
      )},
      moveDoc&&h('div',{style:{display:'flex',flexDirection:'column',gap:16,paddingTop:8}},
        h('div',null,h('b',null,'文件：'),moveDoc.title),
        h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
          h('div',{style:{fontSize:13,fontWeight:600,color:'#667380',marginBottom:2}},'目標專案'),
          h(Select,{value:moveTargetProjId,onChange:function(v){setMoveTargetProjId(v);setMoveTargetCatId(null);},
            placeholder:'選擇專案',style:{width:'100%'},allowClear:true,
            options:moveProjects.map(function(p){return{label:p.name,value:p.id};})})
        ),
        h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
          h('div',{style:{fontSize:13,fontWeight:600,color:'#667380',marginBottom:2}},'目標資料夾',h('span',{style:{color:'#ff4d4f',marginLeft:2}},'*')),
          h(Select,{value:moveTargetCatId,onChange:setMoveTargetCatId,
            placeholder:moveTargetProjId?'選擇資料夾（必填）':'請先選擇專案',
            style:{width:'100%'},allowClear:false,disabled:!moveTargetProjId,
            options:moveCats.map(function(c){return{label:c.name,value:c.id};})})
        )
      )
    ),
    // ── 鎖定/解鎖 確認 Modal（二次確認）
    h(Modal,{
      title:h('span',null,
        h('span',{style:{marginRight:8}},lockDoc&&lockDoc.action==='lock'?'🔒':'🔓'),
        lockDoc&&lockDoc.action==='lock'?'確認鎖定文件':'確認解鎖文件'
      ),
      open:!!lockDoc,
      onCancel:function(){if(!locking)setLockDoc(null);},
      width:480,
      footer:h(Space,null,
        h(Button,{onClick:function(){setLockDoc(null);},disabled:locking},'取消'),
        h(Button,{
          type:'primary',
          danger:lockDoc&&lockDoc.action==='lock',
          loading:locking,
          onClick:confirmLock
        },lockDoc&&lockDoc.action==='lock'?'確認鎖定':'確認解鎖')
      )},
      lockDoc&&h('div',null,
        lockDoc.action==='lock'
          ? h(Alert,{
              type:'warning',
              showIcon:true,
              message:'鎖定後的影響',
              description:h('ul',{style:{margin:'4px 0 0 0',paddingLeft:20,lineHeight:1.8}},
                h('li',null,'非管理員將',h('strong',null,'無法編輯'),'此文件'),
                h('li',null,'任何人（包含管理員）將',h('strong',null,'無法刪除'),'此文件'),
                h('li',null,'需由管理員手動解鎖才能恢復')
              ),
              style:{marginBottom:16}
            })
          : h(Alert,{
              type:'info',
              showIcon:true,
              message:'解鎖後所有有權限的用戶可重新編輯及刪除此文件。',
              style:{marginBottom:16}
            }),
        h('div',{style:{fontSize:14}},
          lockDoc.action==='lock'?'確定要鎖定文件《':'確定要解鎖文件《',
          h('strong',null,lockDoc.rec.title),
          '》？'
        )
      )
    ),
    // ── New Doc Modal
    h(NewDocModal,{
      open:showNewDocModal,
      hasCat:!!activeCatId,
      onCancel:function(){setShowNewDocModal(false);},
      onFreeWrite:function(){
        setShowNewDocModal(false);
        var qs='';
        if(activeProjectId)qs+=(qs?'&':'?')+'projectId='+activeProjectId;
        if(activeCatId)qs+=(qs?'&':'?')+'categoryId='+activeCatId;
        navigate('/admin/doc-hub/edit/new'+qs);
      },
      onTemplate:function(){
        setShowNewDocModal(false);
        setShowTplSelectModal(true);
      },
      onGitSync:function(){
        setShowNewDocModal(false);
        // Open the git sync modal (reuse existing syncDoc pattern with 'new')
        navigate('/admin/doc-hub/edit/new?gitSync=1'+(activeProjectId?'&projectId='+activeProjectId:'')+(activeCatId?'&categoryId='+activeCatId:''));
      },
      onImportFile:function(){
        setShowNewDocModal(false);
        setShowImportModal(true);
      }
    }),
    // ── Import from File Modal ─────────────────────────────────────────
    h(ImportFromFileModal,{
      open:showImportModal,
      client:client,
      onCancel:function(){setShowImportModal(false);},
      onConfirm:function(data){
        // Create doc directly via API with converted markdown
        if(!activeCatId){ message.error('請先選擇資料夾'); return; }
        client.request({
          url:'docDocuments:create', method:'post',
          data:{
            title: data.title,
            content: data.content,
            categoryId: activeCatId,
            projectId: activeProjectId || null,
            status: 'draft'
          }
        }).then(function(res){
          setShowImportModal(false);
          message.success('匯入成功，已建立新文件');
          var newId = res && res.data && (res.data.data ? res.data.data.id : res.data.id);
          if(newId) navigate('/admin/doc-hub/edit/'+newId);
          else refreshList();
        }).catch(function(err){
          message.error('建立失敗：'+((err&&err.message)||err));
        });
      }
    }),
    // ── Template Select Modal
    h(TemplateSelectModal,{
      open:showTplSelectModal,
      onCancel:function(){setShowTplSelectModal(false);},
      projectId:activeProjectId,
      onSelect:function(tpl){
        setShowTplSelectModal(false);
        var qs='templateId='+tpl.id;
        if(activeProjectId)qs+='&projectId='+activeProjectId;
        if(tpl.defaultCategoryId)qs+='&categoryId='+tpl.defaultCategoryId;
        else if(activeCatId)qs+='&categoryId='+activeCatId;
        navigate('/admin/doc-hub/template-fill/new?'+qs);
      }
    }),
    // ── Audit Log Modal
    h(Modal,{
      title:h('span',null,h(HistoryOutlined,{style:{marginRight:8,color:'#1677ff'}}),'稽核日誌'),
      open:showAuditLog,
      onCancel:function(){setShowAuditLog(false);},
      width:'90vw',
      style:{top:20,maxWidth:1400},
      bodyStyle:{padding:'16px 24px',maxHeight:'calc(100vh - 200px)',overflow:'auto'},
      footer:h(Button,{onClick:function(){setShowAuditLog(false);}},'關閉')},
      auditLoading
        ? h('div',{style:{textAlign:'center',padding:40}},h(Spin,null))
        : h('div',null,
            // 篩選列
            h('div',{style:{display:'flex',gap:12,marginBottom:16,padding:'12px 16px',background:'#f5f7fa',borderRadius:6,flexWrap:'wrap',alignItems:'center'}},
              h('span',{style:{fontSize:13,color:'#525c68',fontWeight:500}},'篩選：'),
              h(Select,{
                value:auditActionFilter,
                onChange:setAuditActionFilter,
                style:{width:140},
                size:'small',
                options:[
                  {value:'all',label:'全部動作'},
                  {value:'create',label:'建立'},
                  {value:'update',label:'更新'},
                  {value:'delete',label:'刪除'},
                  {value:'lock',label:'鎖定'},
                  {value:'unlock',label:'解鎖'},
                  {value:'git_sync_failed',label:'Git同步失敗'},
                ]
              }),
              h(Input,{
                placeholder:'操作者姓名',
                value:auditUserFilter,
                onChange:function(e){setAuditUserFilter(e.target.value);},
                style:{width:160},
                size:'small',
                allowClear:true
              }),
              h(Input,{
                placeholder:'日期 (YYYY/MM/DD)',
                value:auditDateFilter,
                onChange:function(e){setAuditDateFilter(e.target.value);},
                style:{width:180},
                size:'small',
                allowClear:true
              }),
              h(Button,{size:'small',onClick:function(){setAuditActionFilter('all');setAuditUserFilter('');setAuditDateFilter('');}},'清除')
            ),
            h(Table,{
            dataSource:(function(){
              var d=auditData;
              if(auditActionFilter!=='all')d=d.filter(function(r){return r.action===auditActionFilter;});
              if(auditUserFilter)d=d.filter(function(r){return (r.userNickname||'').toLowerCase().indexOf(auditUserFilter.toLowerCase())>=0;});
              if(auditDateFilter){
                var dk=auditDateFilter.replace(/-/g,'/');
                d=d.filter(function(r){
                  if(!r.createdAt)return false;
                  var s=new Date(r.createdAt).toLocaleDateString('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit'}).replace(/-/g,'/');
                  return s.indexOf(dk)>=0;
                });
              }
              return d;
            })(),
            rowKey:'id',
            size:'small',
            pagination:{pageSize:15,showTotal:function(t){return '共 '+t+' 筆';}},
            columns:[
              {title:'時間',key:'createdAt',width:150,render:function(_,r){
                if(!r.createdAt)return '-';
                return new Date(r.createdAt).toLocaleString('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'});
              }},
              {title:'操作者',key:'user',width:120,render:function(_,r){return r.userNickname||'-';}},
              {title:'動作',key:'action',width:100,render:function(_,r){
                var colorMap={create:'green',update:'blue',delete:'red',lock:'orange',unlock:'cyan',git_sync_failed:'magenta'};
                var labelMap={create:'建立',update:'更新',delete:'刪除',lock:'鎖定',unlock:'解鎖',git_sync_failed:'Git同步失敗'};
                return h(Tag,{color:colorMap[r.action]||'default',style:{fontSize:12}},labelMap[r.action]||r.action||'-');
              }},
              {title:'資源類型',key:'resourceType',width:120,render:function(_,r){
                var labelMap={docDocuments:'文件',docCategories:'資料夾',docProjects:'專案'};
                return h('span',{style:{fontSize:12,color:'#667380'}},labelMap[r.resourceType]||r.resourceType||'-');
              }},
              {title:'文件標題',key:'resourceTitle',render:function(_,r){
                return h('span',{style:{fontSize:13}},r.resourceTitle||'-');
              }},
              {title:'詳細資訊',key:'detail',width:200,render:function(_,r){
                if(!r.detail)return '-';
                var d=r.detail;
                var parts=[];
                if(d.changedFields)parts.push('修改欄位: '+d.changedFields.join(', '));
                if(d.status)parts.push('狀態: '+d.status);
                if(d.errorMsg)parts.push('錯誤: '+d.errorMsg.substring(0,60));
                return h('span',{style:{fontSize:12,color:'#667380'}},parts.join(' | ')||JSON.stringify(d).substring(0,80));
              }}
            ]
          })
          )
    ),
    // ── Info Bar: Delete Project Modal
    h(Modal,{
      title:h('span',null,h(ExclamationCircleOutlined,{style:{color:'#ff4d4f',marginRight:8}}),'確認刪除專案'),
      open:!!infoDelProj,
      onCancel:function(){setInfoDelProj(null);},
      width:420,
      footer:h(Space,null,
        h(Button,{onClick:function(){setInfoDelProj(null);}},'取消'),
        h(Button,{type:'primary',danger:true,loading:infoDeletingProj,onClick:doInfoDeleteProject},'確認刪除')
      )},
      infoDelProj&&h('div',null,
        h('p',null,'確定要刪除專案「',h('strong',null,infoDelProj.name),'」嗎？'),
        h('p',{style:{color:'#ff4d4f',fontSize:13}},'此操作將刪除專案下所有文件及資料夾，且無法復原。')
      )
    ),
    // ── Info Bar: Project Permissions Modal
    h(Modal,{
      title:h('span',null,'🔐 專案權限設定 — ',(infoPermProj&&infoPermProj.name)||''),
      open:!!infoPermProj,
      onCancel:function(){setInfoPermProj(null);},
      width:580,
      footer:h(Space,null,
        h(Button,{onClick:function(){setInfoPermProj(null);}},'取消'),
        h(Button,{type:'primary',loading:infoPermSaving,onClick:doSaveInfoPermissions},'儲存')
      )},
      infoPermLoading
        ? h('div',{style:{textAlign:'center',padding:40}},h(Spin,null))
        : h('div',{style:{display:'flex',flexDirection:'column',gap:16}},
            h(Alert,{type:'info',showIcon:true,
              message:'權限階層：Viewer ⊂ Subscriber ⊂ Editor（高權限自動包含低權限）',
              description:h('div',null,
                h('table',{style:{width:'100%',fontSize:12,marginTop:6,borderCollapse:'collapse'}},
                  h('thead',null,
                    h('tr',{style:{background:'#f5f5f5'}},
                      h('th',{style:{padding:'4px 8px',textAlign:'left',border:'1px solid #e8e8e8'}},'角色'),
                      h('th',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8'}},'看到專案'),
                      h('th',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8'}},'收通知'),
                      h('th',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8'}},'編輯文件')
                    )
                  ),
                  h('tbody',null,
                    h('tr',null,
                      h('td',{style:{padding:'4px 8px',border:'1px solid #e8e8e8'}},'👁 Viewer'),
                      h('td',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8',color:'#52c41a'}},'✓'),
                      h('td',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8',color:'#bfbfbf'}},'—'),
                      h('td',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8',color:'#bfbfbf'}},'—')
                    ),
                    h('tr',null,
                      h('td',{style:{padding:'4px 8px',border:'1px solid #e8e8e8'}},'🔔 Subscriber'),
                      h('td',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8',color:'#52c41a'}},'✓'),
                      h('td',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8',color:'#52c41a'}},'✓'),
                      h('td',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8',color:'#bfbfbf'}},'—')
                    ),
                    h('tr',null,
                      h('td',{style:{padding:'4px 8px',border:'1px solid #e8e8e8'}},'✏️ Editor'),
                      h('td',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8',color:'#52c41a'}},'✓'),
                      h('td',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8',color:'#52c41a'}},'✓'),
                      h('td',{style:{padding:'4px 8px',textAlign:'center',border:'1px solid #e8e8e8',color:'#52c41a'}},'✓')
                    )
                  )
                ),
                h('div',{style:{marginTop:6,fontSize:12,color:'#666'}},'💡 提示：每個用戶只需勾選在「最高權限」欄位即可，系統會自動授予較低權限。')
              )}),
            h('div',null,
              h('div',{style:{fontWeight:600,marginBottom:4}},'👁 閱覽者（Viewer）'),
              h('div',{style:{fontSize:12,color:'#888',marginBottom:6}},'可看到此專案及其文件清單，但不會收到通知，也不能編輯'),
              h(Select,{mode:'multiple',style:{width:'100%'},value:infoPermViewerIds,onChange:setInfoPermViewerIds,
                placeholder:'選擇可閱覽的使用者',
                options:infoPermAllUsers.map(function(u){return{label:(u.nickname||u.username||'#'+u.id),value:u.id};})})
            ),
            h('div',null,
              h('div',{style:{fontWeight:600,marginBottom:4}},'🔔 訂閱者（Subscriber）'),
              h('div',{style:{fontSize:12,color:'#888',marginBottom:6}},'可查看 + 文件有任何新增/更新時收到站內信通知'),
              h(Select,{mode:'multiple',style:{width:'100%'},value:infoPermSubscriberIds,onChange:setInfoPermSubscriberIds,
                placeholder:'選擇接收通知的使用者',
                options:infoPermAllUsers.map(function(u){return{label:(u.nickname||u.username||'#'+u.id),value:u.id};})})
            ),
            h('div',null,
              h('div',{style:{fontWeight:600,marginBottom:4}},'✏️ 編輯者（Editor）'),
              h('div',{style:{fontSize:12,color:'#888',marginBottom:6}},'可查看 + 收通知 + 編輯/新增/刪除此專案下的文件'),
              h(Select,{mode:'multiple',style:{width:'100%'},value:infoPermEditorIds,onChange:setInfoPermEditorIds,
                placeholder:'選擇可編輯的使用者',
                options:infoPermAllUsers.map(function(u){return{label:(u.nickname||u.username||'#'+u.id),value:u.id};})})
            )
          )
    ),
    // ── Info Bar: Delete Category Modal
    h(Modal,{
      title:h('span',null,h(ExclamationCircleOutlined,{style:{color:'#ff4d4f',marginRight:8}}),'確認刪除資料夾'),
      open:!!infoDelCat,
      onCancel:function(){setInfoDelCat(null);},
      width:420,
      footer:h(Space,null,
        h(Button,{onClick:function(){setInfoDelCat(null);}},'取消'),
        h(Button,{type:'primary',danger:true,loading:infoDeletingCat,onClick:doInfoDeleteCat},'確認刪除')
      )},
      infoDelCat&&h('div',null,
        h('p',null,'確定要刪除資料夾「',h('strong',null,infoDelCat.name),'」嗎？'),
        h('p',{style:{color:'#ff4d4f',fontSize:13}},'子資料夾也會一併刪除，但文件不會被刪除。此操作無法復原。')
      )
    ),
    // ── Info Bar: Category Permissions Modal
    h(Modal,{
      title:h('span',null,'🔐 資料夾權限設定 — ',(infoCatPerm&&infoCatPerm.name)||''),
      open:!!infoCatPerm,
      onCancel:function(){setInfoCatPerm(null);},
      width:540,
      footer:h(Space,null,
        h(Button,{onClick:function(){setInfoCatPerm(null);}},'取消'),
        h(Button,{type:'primary',loading:infoCatPermSaving,onClick:doSaveInfoCatPermissions},'儲存')
      )},
      infoCatPermLoading
        ? h('div',{style:{textAlign:'center',padding:32}},h(Spin,null))
        : h('div',null,
            h('div',{style:{marginBottom:20,padding:'12px 16px',background:'#f8fafc',borderRadius:8,border:'1px solid #e8ecf0'}},
              h('div',{style:{fontWeight:600,marginBottom:12,color:'#333'}},'權限模式'),
              h('div',{style:{display:'flex',flexDirection:'column',gap:10}},
                h('label',{style:{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}},
                  h('input',{type:'radio',checked:!infoCatPermOverride,onChange:function(){setInfoCatPermOverride(false);},style:{marginTop:2}}),
                  h('div',null,
                    h('div',{style:{fontWeight:500,color:'#333'}},'繼承專案設定（預設）'),
                    h('div',{style:{fontSize:12,color:'#888',marginTop:2}},'套用此資料夾所屬專案的 Viewer / Editor 設定')
                  )
                ),
                h('label',{style:{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}},
                  h('input',{type:'radio',checked:infoCatPermOverride,onChange:function(){setInfoCatPermOverride(true);},style:{marginTop:2}}),
                  h('div',null,
                    h('div',{style:{fontWeight:500,color:'#faad14'}},'自訂此資料夾的權限'),
                    h('div',{style:{fontSize:12,color:'#888',marginTop:2}},'獨立設定，不受專案權限影響')
                  )
                )
              )
            ),
            h('div',{style:{opacity:infoCatPermOverride?1:0.4,pointerEvents:infoCatPermOverride?'auto':'none',transition:'opacity 0.2s'}},
              h('div',{style:{display:'flex',flexDirection:'column',gap:16}},
                h('div',null,
                  h('div',{style:{fontWeight:600,marginBottom:6,color:'#333'}},'📖 可查看（Viewer）'),
                  h(Select,{mode:'multiple',style:{width:'100%'},value:infoCatPermViewerIds,onChange:setInfoCatPermViewerIds,
                    placeholder:'選擇可查看的用戶...',optionFilterProp:'label',
                    options:infoPermAllUsers.map(function(u){return{value:u.id,label:(u.nickname||u.username||u.email||'#'+u.id)};})})
                ),
                h('div',null,
                  h('div',{style:{fontWeight:600,marginBottom:6,color:'#333'}},'✏️ 可編輯（Editor）'),
                  h(Select,{mode:'multiple',style:{width:'100%'},value:infoCatPermEditorIds,onChange:setInfoCatPermEditorIds,
                    placeholder:'選擇可編輯的用戶...',optionFilterProp:'label',
                    options:infoPermAllUsers.map(function(u){return{value:u.id,label:(u.nickname||u.username||u.email||'#'+u.id)};})})
                )
              )
            )
          )
    )
  );
}

function useOptions(resource){
  var client=useAPIClient();
  var _d=useState([]);var data=_d[0];var setData=_d[1];
  useEffect(function(){
    if(!client)return;
    var all=[];
    function fetchPage(page){
      return client.request({url:resource+':list',method:'get',params:{pageSize:200,page:page}})
        .then(function(res){
          var list=(res.data&&res.data.data)||[];
          all=all.concat(list);
          if(list.length>=200)return fetchPage(page+1);
          setData(all);
        });
    }
    fetchPage(1).catch(function(){});
  },[client,resource]);
  return data;
}

function PermissionPanel(props){
  var label=props.label,hint=props.hint,members=props.members||[],allUsers=props.allUsers||[],onAdd=props.onAdd,onRemove=props.onRemove;
  var _open=useState(false);var popOpen=_open[0];var setPopOpen=_open[1];
  var unselected=allUsers.filter(function(u){return!members.find(function(m){return m.id===u.id;});});
  var popContent=h('div',{style:{width:200}},
    unselected.length===0?h('div',{style:{color:'#999',padding:'8px 0',fontSize:12}},'No more users'):
    unselected.map(function(u){
      return h('div',{key:u.id,style:{padding:'6px 8px',cursor:'pointer',borderRadius:4,fontSize:13},
        onMouseEnter:function(e){e.currentTarget.style.background='#f0f5ff';},
        onMouseLeave:function(e){e.currentTarget.style.background='transparent';},
        onClick:function(){onAdd(u);setPopOpen(false);}},
        h(UserOutlined,{style:{marginRight:6,color:'#1677ff'}}),u.nickname||u.username||u.email
      );
    })
  );
  return h('div',{style:{flex:1,minWidth:0}},
    h('div',{style:{fontSize:12,fontWeight:700,color:'#667380',marginBottom:6}},label),
    hint&&h('div',{style:{fontSize:10,color:'#99a1ab',marginBottom:6}},hint),
    h('div',{style:{display:'flex',flexWrap:'wrap',gap:4,marginBottom:6,minHeight:24}},
      members.map(function(m){
        return h(Tag,{key:m.id,closable:true,onClose:function(){onRemove(m);},style:{marginBottom:2}},m.nickname||m.username||m.email);
      }),
      members.length===0&&h('span',{style:{color:'#ccc',fontSize:12}},'—')
    ),
    h(Popover,{content:popContent,trigger:'click',open:popOpen,onOpenChange:setPopOpen,placement:'bottomLeft'},
      h(Button,{size:'small',icon:h(PlusOutlined),style:{fontSize:12}},'加入')
    )
  );
}

function EditPage(){
  var params=useParams();
  var docId=params.id||'new';
  var isNew=docId==='new';
  var navigate=useNavigate();
  var loc=useLocation();
  var client=useAPIClient();
  var currentUserEdit=useCurrentUser();
  var isAdminEdit=!!(currentUserEdit&&(Number(currentUserEdit.id)===1||(currentUserEdit.roles&&currentUserEdit.roles.some(function(r){return r.name==='root'||r.name==='admin';}))));
  var _dl=useDoc(isNew?null:docId);var docData=_dl.doc;var docLoading=_dl.loading;
  // 解析 query params（新增時帶入預設 projectId/categoryId）
  var _initIds=(function(){
    var qs=new URLSearchParams(loc.search||'');
    return {projectId:qs.get('projectId')?parseInt(qs.get('projectId')):null,categoryId:qs.get('categoryId')?parseInt(qs.get('categoryId')):null,gitSync:qs.get('gitSync')==='1'};
  })();
  var _f=useState({title:'',content:'',status:_initIds.gitSync?'published':'draft',projectId:_initIds.projectId,categoryId:_initIds.categoryId,githubRepo:'',githubFilePath:'',githubBranch:'',tags:[]});var form=_f[0];var setForm=_f[1];
  var _sv=useState(false);var saving=_sv[0];var setSaving=_sv[1];
  var _syn=useState(false);var syncing=_syn[0];var setSyncing=_syn[1];
  var _sm=useState(false);var showSync=_sm[0];var setShowSync=_sm[1];
  var _sc=useState(false);var showSaveModal=_sc[0];var setShowSaveModal=_sc[1];
  var _cs=useState('');var changeSummary=_cs[0];var setChangeSummary=_cs[1];
  var _br=useState(false);var btnReady=_br[0];var setBtnReady=_br[1];
  var _mr=useState(!!window.marked);var markedReady=_mr[0];var setMarkedReady=_mr[1];
  var _gem=useState(_initIds.gitSync===true);var gitEditMode=_gem[0];var setGitEditMode=_gem[1];
  // Git 衝突 Modal
  var _gc=useState(false);var showConflict=_gc[0];var setShowConflict=_gc[1];
  var _gl=useState(false);var pulling=_gl[0];var setPulling=_gl[1];
  useEffect(function(){
    loadMarked(function(){setMarkedReady(true);});
    var existSt=document.getElementById('dochub-md-style');
    if(existSt)existSt.parentNode.removeChild(existSt);
    var st=document.createElement('style');
    st.id='dochub-md-style';
    st.textContent=[
      '.dochub-preview table{border-collapse:collapse;width:100%;margin:12px 0}',
      '.dochub-preview th,.dochub-preview td{border:1px solid #e2e8f0;padding:8px 12px;text-align:left;font-size:13px;color:#334155}',
      '.dochub-preview th{background:#f8fafc;font-weight:600;color:#1e293b}',
      '.dochub-preview tr:nth-child(even) td{background:#f8fafc}',
      '.dochub-preview pre{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px 16px;overflow:auto;font-size:12.5px;line-height:1.6;margin:10px 0}',
      '.dochub-preview code{background:#f1f5f9;border-radius:3px;padding:2px 6px;font-size:12.5px;color:#0f766e;font-family:monospace}',
      '.dochub-preview pre code{background:transparent;padding:0;color:#334155}',
      '.dochub-preview h1{font-size:24px;font-weight:700;margin:24px 0 12px;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:8px}',
      '.dochub-preview h2{font-size:19px;font-weight:700;margin:20px 0 8px;color:#1e293b}',
      '.dochub-preview h3{font-size:16px;font-weight:600;margin:16px 0 6px;color:#1e293b}',
      '.dochub-preview blockquote{border-left:3px solid #0d9488;padding:6px 14px;margin:10px 0;color:#475569;background:#f0fdfa;border-radius:0 4px 4px 0}',
      '.dochub-preview a{color:#0d9488;text-decoration:none}',
      '.dochub-preview a:hover{text-decoration:underline}',
      '.dochub-preview ul,.dochub-preview ol{padding-left:20px;margin:8px 0}',
      '.dochub-preview li{margin:3px 0;color:#334155}',
      '.dochub-preview p{margin:8px 0;color:#334155;line-height:1.7}',
      '.dochub-preview hr{border:none;border-top:1px solid #e2e8f0;margin:20px 0}',
    ].join('\n');
    document.head.appendChild(st);
  },[]);
  // permission members state
  var _vw=useState([]);var viewers=_vw[0];var setViewers=_vw[1];
  var _ed=useState([]);var editors=_ed[0];var setEditors=_ed[1];
  var _sb=useState([]);var subscribers=_sb[0];var setSubscribers=_sb[1];
  // options
  var allUsers=useOptions('users');
  var allProjects=useOptions('docProjects');
  // tag autocomplete options
  var _tagOpts=useState([]);var tagOpts=_tagOpts[0];var setTagOpts=_tagOpts[1];
  useEffect(function(){
    if(!client)return;
    client.request({url:'docTags:list',method:'get',params:{pageSize:100,sort:['-usageCount','name']}})
      .then(function(res){var list=(res.data&&res.data.data)||[];setTagOpts(list);})
      .catch(function(){setTagOpts([]);});
  },[client]);
  // 動態載入所選專案下的分類
  var _cats=useState([]);var projCats=_cats[0];var setProjCats=_cats[1];
  useEffect(function(){
    if(!client||!form.projectId){setProjCats([]);return;}
    client.request({url:'docCategories:list',method:'get',params:{pageSize:200,filter:{projectId:form.projectId},sort:['sort']}})
      .then(function(res){
        var cats=(res.data&&res.data.data)||[];
        setProjCats(cats);
      })
      .catch(function(){setProjCats([]);});
  },[client,form.projectId]);

  useEffect(function(){
    if(!docData)return;
    setForm({title:docData.title||'',content:docData.content||'',status:docData.status||'draft',
      projectId:docData.projectId||null,categoryId:docData.categoryId||null,
      githubRepo:docData.githubRepo||'',githubFilePath:docData.githubFilePath||'',githubBranch:docData.githubBranch||'',
      tags:(docData.tags||[]).map(function(t){return t.name;})});
    setViewers(docData.viewers||[]);
    setEditors(docData.editors||[]);
    setSubscribers(docData.subscribers||[]);
  },[docData]);
  useEffect(function(){
    if(showSaveModal){setBtnReady(false);var t=setTimeout(function(){setBtnReady(true);},800);return function(){clearTimeout(t);};}
  },[showSaveModal]);

  // 未儲存偵測
  var _dirty=useState(false);var isDirty=_dirty[0];var setIsDirty=_dirty[1];
  var _lastSaved=useState(null);var lastAutoSaved=_lastSaved[0];var setLastAutoSaved=_lastSaved[1];
  var _autoRef=useRef(null);

  function setField(k,v){setForm(function(f){var nf={};for(var key in f)nf[key]=f[key];nf[k]=v;return nf;});setIsDirty(true);}

  // 自動儲存草稿（30秒，非新文件且有內容時）
  useEffect(function(){
    if(isNew||!isDirty||saving)return;
    if(_autoRef.current)clearTimeout(_autoRef.current);
    _autoRef.current=setTimeout(function(){
      if(!client||!form.title||!form.title.trim())return;
      var payload=Object.assign({},form,{
        viewerIds:viewers.map(function(u){return u.id;}),
        editorIds:editors.map(function(u){return u.id;}),
        subscriberIds:subscribers.map(function(u){return u.id;}),
        changeSummary:'（自動儲存）',
      });
      client.request({url:'docDocuments:update',method:'post',params:{filterByTk:docId},data:payload})
        .then(function(){setIsDirty(false);setLastAutoSaved(new Date());})
        .catch(function(){});
    },30000);
    return function(){if(_autoRef.current)clearTimeout(_autoRef.current);};
  },[form,isDirty,isNew,saving]);

  // 離頁提示（有未儲存內容時）
  useEffect(function(){
    function onBeforeUnload(e){
      if(!isDirty)return;
      e.preventDefault();e.returnValue='';
    }
    window.addEventListener('beforeunload',onBeforeUnload);
    return function(){window.removeEventListener('beforeunload',onBeforeUnload);};
  },[isDirty]);

  // 全局快捷鍵
  useEffect(function(){
    function onKeyDown(e){
      var isMac=navigator.platform.toUpperCase().indexOf('MAC')>=0;
      var ctrl=isMac?e.metaKey:e.ctrlKey;
      if(!ctrl)return;
      if(e.key==='s'&&!e.shiftKey){e.preventDefault();handleSave();return;}
      if(e.key==='s'&&e.shiftKey){e.preventDefault();handlePublish();return;}
      // Bold / Italic / Underline（在 textarea 焦點時）
      var ta=document.getElementById('dochub-editor');
      if(document.activeElement!==ta)return;
      if(e.key==='b'){e.preventDefault();insertMd('**','**');return;}
      if(e.key==='i'){e.preventDefault();insertMd('_','_');return;}
      if(e.key==='u'){e.preventDefault();insertMd('<u>','</u>');return;}
    }
    document.addEventListener('keydown',onKeyDown);
    return function(){document.removeEventListener('keydown',onKeyDown);};
  },[form,isDirty]);

  // 最近查看：儲存到 localStorage（viewPage 時才記，但 edit 時也記）
  useEffect(function(){
    if(isNew||!docData)return;
    try{
      var key='dochub_recent';
      var existing=JSON.parse(localStorage.getItem(key)||'[]');
      var entry={id:docId,title:docData.title||'（無標題）',ts:Date.now(),projectId:docData.projectId||form.projectId,categoryId:docData.categoryId||form.categoryId,projectName:(docData.project&&docData.project.name)||'',categoryName:(docData.category&&docData.category.name)||''};
      var filtered=existing.filter(function(x){return String(x.id)!==String(docId);});
      filtered.unshift(entry);
      if(filtered.length>8)filtered=filtered.slice(0,8);
      localStorage.setItem(key,JSON.stringify(filtered));
    }catch(e){}
  },[docId,docData]);

  function doSave(cs, overrideStatus, skipConflict){
    if(!client)return;
    setSaving(true);
    var url=isNew?'docDocuments:create':'docDocuments:update';
    var payload=Object.assign({},form,{
      viewerIds:viewers.map(function(u){return u.id;}),
      editorIds:editors.map(function(u){return u.id;}),
      subscriberIds:subscribers.map(function(u){return u.id;})
    });
    if(overrideStatus)payload.status=overrideStatus;
    if(cs&&cs.trim())payload.changeSummary=cs.trim();
    if(skipConflict)payload.skipConflictCheck=true;
    var cfg=isNew?{url:url,method:'post',data:payload}:{url:url,method:'post',params:{filterByTk:docId},data:payload};
    client.request(cfg)
      .then(function(){message.success('儲存成功');setSaving(false);setShowSaveModal(false);setChangeSummary('');setIsDirty(false);setLastAutoSaved(new Date());if(isNew){var qs='';if(form.projectId)qs+='?projectId='+form.projectId;if(form.categoryId)qs+=(qs?'&':'?')+'categoryId='+form.categoryId;navigate('/admin/doc-hub'+qs);}})
      .catch(function(err){
        setSaving(false);
        // 409 = Git 衝突
        var status=err&&err.response&&err.response.status;
        var code=err&&err.response&&err.response.data&&err.response.data.errors&&err.response.data.errors[0]&&err.response.data.errors[0].code;
        if(status===409||code==='GIT_CONFLICT'){
          setShowConflict(true);
          setShowSaveModal(false);
        } else {
          message.error('失敗: '+(err&&err.message||'error'));
        }
      });
  }

  function doPullFromGit(){
    if(!client)return;
    setPulling(true);
    if(isNew){
      // 新增文件：直接用 repo+filePath 拉取，不需要 filterByTk
      client.request({url:'docDocuments:fetchFromGit',method:'post',data:{githubRepo:form.githubRepo,githubFilePath:form.githubFilePath,branch:form.githubBranch||'master'}})
        .then(function(res){
          var d=res.data&&res.data.data;
          if(d&&d.content){
            setForm(function(f){return Object.assign({},f,{content:d.content});});
            message.success('已從 GitHub 拉取內容，請填寫標題後儲存');
          }
          setPulling(false);
        })
        .catch(function(err){
          setPulling(false);
          var status=err&&err.response&&err.response.status;
          var svrMsg=err&&err.response&&err.response.data&&err.response.data.errors&&err.response.data.errors[0]&&err.response.data.errors[0].message;
          var msg=status===503?'Git Token 未設定：'+(svrMsg||'請聯繫管理員設定環境變數'):'拉取失敗: '+(svrMsg||err&&err.message||'error');
          message.error(msg,status===503?8:4);
        });
    } else {
      client.request({url:'docDocuments:pullFromGit',method:'post',params:{filterByTk:docId}})
        .then(function(res){
          var d=res.data&&res.data.data;
          if(d){
            setForm(function(f){return Object.assign({},f,{content:d.content||f.content,githubRepo:d.githubRepo||f.githubRepo,githubFilePath:d.githubFilePath||f.githubFilePath});});
          }
          setPulling(false);
          setShowConflict(false);
          message.success('已同步 Git 最新版本，請重新編輯後儲存');
        })
        .catch(function(err){
          setPulling(false);
          var status=err&&err.response&&err.response.status;
          var svrMsg=err&&err.response&&err.response.data&&err.response.data.errors&&err.response.data.errors[0]&&err.response.data.errors[0].message;
          var msg=status===503?'Git Token 未設定：'+(svrMsg||'請聯繫管理員設定環境變數'):'拉取失敗: '+(svrMsg||err&&err.message||'error');
          message.error(msg,status===503?8:4);
        });
    }
  }

  function validateForm(){
    if(!form.title||!form.title.trim()){message.warning('請先填寫文件標題');return false;}
    if(!form.categoryId){message.warning('請選擇所屬資料夾');return false;}
    return true;
  }

  function handleSave(){
    if(!validateForm())return;
    if(isNew){doSave('');return;}
    // 非新文件，彈 Modal 讓使用者填 changeSummary
    setChangeSummary('');
    setShowSaveModal(true);
  }

  function handlePublish(){
    if(!validateForm())return;
    if(isNew){doSave('','published');return;}
    setChangeSummary('');
    setShowSaveModal('published');
  }

  function handleSyncConfirm(){
    if(!client||isNew)return;
    setSyncing(true);
    client.request({url:'docDocuments:syncToGit',method:'post',params:{filterByTk:docId}})
      .then(function(){message.success('同步成功');setSyncing(false);setShowSync(false);})
      .catch(function(err){message.error('失敗: '+(err&&err.message||'error'));setSyncing(false);});
  }

  // toolbar button insert helper
  function insertMd(prefix,suffix){
    var ta=document.getElementById('dochub-editor');
    if(!ta)return;
    var s=ta.selectionStart,e=ta.selectionEnd,v=form.content;
    var sel=v.substring(s,e)||'text';
    var newVal=v.substring(0,s)+prefix+sel+suffix+v.substring(e);
    setField('content',newVal);
  }

  // 圖片插入 helper（插在游標位置）
  function insertImageMd(url,alt){
    var ta=document.getElementById('dochub-editor');
    var pos=ta?ta.selectionStart:(form.content||'').length;
    var v=form.content||'';
    var md='!['+( alt||'image')+']('+url+')';
    setField('content',v.substring(0,pos)+md+v.substring(pos));
  }

  // 上傳圖片到 server
  var _imgUploading=useState(false);var imgUploading=_imgUploading[0];var setImgUploading=_imgUploading[1];

  function uploadImageFile(file){
    if(!file)return;
    var allowed=['image/jpeg','image/png','image/gif','image/webp'];
    if(!allowed.includes(file.type)){message.error('只支援 JPG / PNG / GIF / WebP');return;}
    setImgUploading(true);
    var fd=new FormData();
    fd.append('file',file);
    // 用原生 fetch，帶 token
    var token=localStorage.getItem('NOCOBASE_TOKEN')||'';
    fetch('/api/docDocuments:uploadImage',{method:'POST',headers:{'Authorization':'Bearer '+token},body:fd})
      .then(function(r){return r.json();})
      .then(function(r){
        var url=r&&r.data&&r.data.url;
        if(url){insertImageMd(url,file.name.replace(/\.[^.]+$/,''));message.success('圖片上傳成功');}
        else{message.error('上傳失敗');}
        setImgUploading(false);
      })
      .catch(function(){message.error('上傳失敗');setImgUploading(false);});
  }

  // 附件（PDF/Word/Excel/PPT/zip…）插入 helper
  function insertAttachmentMd(url,filename,ext){
    var ta=document.getElementById('dochub-editor');
    var pos=ta?ta.selectionStart:(form.content||'').length;
    var v=form.content||'';
    var md=ext==='.pdf'
      ? '\n!pdf['+filename+']('+url+')\n'
      : '[📎 '+filename+']('+url+')';
    setField('content',v.substring(0,pos)+md+v.substring(pos));
  }

  var _fileUploading=useState(false);var fileUploading=_fileUploading[0];var setFileUploading=_fileUploading[1];

  function uploadAttachmentFile(file){
    if(!file)return;
    var name=file.name||'';
    var extMatch=name.toLowerCase().match(/\.[^.]+$/);
    var ext=extMatch?extMatch[0]:'';
    var allowedExts=['.pdf','.doc','.docx','.xls','.xlsx','.ppt','.pptx','.csv','.txt','.zip','.rar','.7z','.md'];
    if(allowedExts.indexOf(ext)<0){message.error('不支援的檔案類型：'+ext);return;}
    if(file.size>50*1024*1024){message.error('檔案過大（上限 50MB）');return;}
    setFileUploading(true);
    var fd=new FormData();
    fd.append('file',file);
    var token=localStorage.getItem('NOCOBASE_TOKEN')||'';
    fetch('/api/docDocuments:uploadFile',{method:'POST',headers:{'Authorization':'Bearer '+token},body:fd})
      .then(function(r){return r.json();})
      .then(function(r){
        var d=r&&r.data;
        if(d&&d.url){insertAttachmentMd(d.url,d.filename||name,ext);message.success('附件上傳成功');}
        else{message.error((r&&r.errors&&r.errors[0]&&r.errors[0].message)||'上傳失敗');}
        setFileUploading(false);
      })
      .catch(function(){message.error('上傳失敗');setFileUploading(false);});
  }

  // 處理 textarea paste 貼圖 / 附件
  function handleEditorPaste(e){
    var items=e.clipboardData&&e.clipboardData.items;
    if(!items)return;
    for(var i=0;i<items.length;i++){
      if(items[i].kind==='file'){
        var f=items[i].getAsFile();
        if(!f)continue;
        if((f.type||'').startsWith('image/')){
          e.preventDefault();
          uploadImageFile(f);
          return;
        }
        e.preventDefault();
        uploadAttachmentFile(f);
        return;
      }
    }
  }

  // 處理 textarea drop 拖圖 / 附件
  function handleEditorDrop(e){
    var files=e.dataTransfer&&e.dataTransfer.files;
    if(!files||!files.length)return;
    var f=files[0];
    if((f.type||'').startsWith('image/')){
      e.preventDefault();
      uploadImageFile(f);
      return;
    }
    e.preventDefault();
    uploadAttachmentFile(f);
  }

  if(docLoading)return h('div',{style:{textAlign:'center',padding:80}},h(Spin,{size:'large'}));

  var isDocLocked=!!(docData&&docData.locked);
  // 非管理員編輯鎖定文件：直接顯示鎖定提示
  if(!isNew&&isDocLocked&&!isAdminEdit){
    return h('div',{style:{minHeight:'100vh',background:'#f5f7fa',display:'flex',alignItems:'center',justifyContent:'center'}},
      h('div',{style:{textAlign:'center'}},
        h('div',{style:{fontSize:48,marginBottom:16}},'🔒'),
        h('div',{style:{fontSize:18,fontWeight:600,color:'#1a1f26',marginBottom:8}},'文件已鎖定'),
        h('div',{style:{color:'#73808c',marginBottom:24}},'此文件目前為鎖定狀態，無法編輯。請聯繫管理員解鎖。'),
        h(Button,{onClick:function(){navigate('/admin/doc-hub/view/'+(docId));}},'查看文件'),
        h(Button,{style:{marginLeft:8},onClick:function(){navigate('/admin/doc-hub');}},'返回列表')
      )
    );
  }

  var isPublished=form.status==='published';
  var statusEl=isPublished
    ?h('div',{style:{background:'#e8fae8',borderRadius:6,padding:'6px 14px',color:'#52c41a',fontWeight:600,fontSize:13}},'Published ●')
    :h('div',{style:{background:'#f5f5f5',borderRadius:6,padding:'6px 14px',color:'#8c8c8c',fontWeight:600,fontSize:13}},'Draft ○');

  var fp='docs/'+(form.title||'untitled').replace(/\s+/g,'-').toLowerCase()+'.md';
  var diffLines=['--- a/'+fp,'+++ b/'+fp,'@@ -0,0 +1 @@','+# '+(form.title||'Document')];

  return h('div',{style:{height:'100vh',background:'#f8fafc',display:'flex',flexDirection:'column',overflow:'hidden'}},

    // 鎖定警告橫幅
    isDocLocked&&h(Alert,{type:'warning',showIcon:true,banner:true,
      message:'⚠️ 此文件已鎖定（管理員可編輯，但非管理員無法編輯或刪除此文件）'}),

    // ── Header（白底）
    h('div',{style:{
      background:'#fff',borderBottom:'1px solid #e2e8f0',
      padding:'0 16px 0 12px',height:52,
      display:'flex',alignItems:'center',justifyContent:'space-between',
      flexShrink:0,gap:12}},
      // 左：返回 + 標題 Input
      h('div',{style:{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0}},
        h(Button,{size:'small',icon:h(ArrowLeftOutlined),
          style:{background:'transparent',border:'1px solid #e2e8f0',color:'#475569',flexShrink:0},
          onClick:function(){var qs='';if(form.projectId)qs+='?projectId='+form.projectId;if(form.categoryId)qs+=(qs?'&':'?')+'categoryId='+form.categoryId;navigate('/admin/doc-hub'+qs);}}),
        h('div',{style:{width:1,height:20,background:'#e2e8f0',flexShrink:0}}),
        isDirty&&h('span',{style:{color:'#f59e0b',fontSize:11,flexShrink:0,lineHeight:1}},'●'),
        h('input',{
          value:form.title,
          onChange:function(e){setField('title',e.target.value);},
          placeholder:'未命名文件',
          style:{
            flex:1,minWidth:0,background:'transparent',border:'none',outline:'none',
            color:'#1e293b',fontSize:16,fontWeight:600,
            borderBottom:form.title&&form.title.trim()?'none':'1px solid #ef4444',
            padding:'2px 0',lineHeight:1.4}})
      ),
      // 右：狀態 + 操作按鈕
      h('div',{style:{display:'flex',alignItems:'center',gap:8,flexShrink:0}},
        // 自動儲存提示
        lastAutoSaved&&!isDirty&&h('span',{style:{fontSize:11,color:'#94a3b8',userSelect:'none'}},
          '已儲存 '+lastAutoSaved.toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})),
        // 狀態 pill
        h('span',{style:{
          padding:'2px 10px',borderRadius:10,fontSize:11,fontWeight:500,
          background:isPublished?'#f0fdfa':'#f1f5f9',
          color:isPublished?'#0d9488':'#64748b',
          border:'1px solid '+(isPublished?'#ccfbf1':'#e2e8f0')}},
          isPublished?'● 已發布':'○ 草稿'),
        h(Tooltip,{title:'儲存 (Cmd+S)'},
          h(Button,{size:'small',loading:saving,onClick:handleSave,
            style:{background:'#fff',border:'1px solid #e2e8f0',color:'#475569',fontSize:13}},'儲存')
        ),
        h(Tooltip,{title:'發布 (Cmd+Shift+S)'},
          h(Button,{size:'small',type:'primary',loading:saving,onClick:handlePublish,
            style:{background:'#0d9488',borderColor:'#0d9488',fontSize:13}},'發布')
        ),
        !!form.githubRepo&&h(Tooltip,{title:isNew?'請先儲存':(!isPublished?'請先發布':'同步到 Git')},
          h(Button,{size:'small',icon:h(SyncOutlined),disabled:isNew||!isPublished,onClick:function(){setShowSync(true);},
            style:{background:'#fff',border:'1px solid #e2e8f0',color:'#64748b'}})
        )
      )
    ),

    // ── Meta bar（屬性列）
    h('div',{style:{
      background:'#f8fafc',borderBottom:'1px solid #e2e8f0',
      padding:'0 16px',height:40,
      display:'flex',alignItems:'center',gap:0,flexShrink:0,overflow:'auto'}},
      // 每個欄位用分隔線隔開
      (function(){
        var metaFields=[
          {label:'專案',content:h(Select,{
            value:form.projectId,size:'small',bordered:false,allowClear:true,
            placeholder:'選擇專案',
            style:{minWidth:130,color:'#334155'},
            onChange:function(v){setField('projectId',v);setField('categoryId',null);},
            options:allProjects.map(function(p){return{label:p.name,value:p.id};})})},
          {label:'資料夾',required:!form.categoryId,content:h('span',null,h(Select,{
            value:form.categoryId,size:'small',bordered:false,allowClear:true,
            disabled:!form.projectId,
            placeholder:form.projectId?'選擇資料夾':'請先選專案',
            style:{minWidth:140,color:!form.categoryId?'#ef4444':'#334155'},
            onChange:function(v){setField('categoryId',v);},
            options:projCats.map(function(c){return{label:c.name,value:c.id};})}),!form.projectId&&h('span',{style:{fontSize:11,color:'#ff4d4f',marginLeft:4}},'請先選擇專案'))},
          {label:'狀態',content:h(Select,{
            value:form.status,size:'small',bordered:false,
            style:{minWidth:100,color:'#334155'},
            onChange:function(v){setField('status',v);},
            options:[{label:'Draft',value:'draft'},{label:'Published',value:'published'}]})},
          {label:'標籤',content:h(Select,{
            mode:'tags',value:form.tags||[],size:'small',bordered:false,
            placeholder:'輸入標籤名稱（Enter 新增）',
            style:{minWidth:220,color:'#334155'},
            tokenSeparators:[','],
            maxTagCount:'responsive',
            onChange:function(v){setField('tags',v);},
            options:tagOpts.map(function(t){return{label:t.name,value:t.name};})})}
        ];
        return metaFields.map(function(f,i){
          return h('div',{key:i,style:{
            display:'flex',alignItems:'center',gap:6,
            padding:'0 14px',borderRight:'1px solid #e2e8f0',
            height:'100%',flexShrink:0}},
            h('span',{style:{
              fontSize:10,fontWeight:600,textTransform:'uppercase',
              letterSpacing:'0.06em',color:f.required?'#ef4444':'#64748b',
              whiteSpace:'nowrap'}},f.label+(f.required?' *':'')),
            f.content
          );
        });
      })()
    ),

    // ── Git Sync bar
    // 三欄一起切：gitEditMode=true 時都可編輯；false 時唯讀顯示並提供「編輯」按鈕切回
    // 已設定 repo 且非編輯模式 → 唯讀綠色 bar；其餘（管理員新建 or 按編輯）→ 三欄都可輸入
    (form.githubRepo && !gitEditMode)
      ? h('div',{style:{
          background:'#f0fdfa',borderBottom:'1px solid #ccfbf1',
          padding:'0 16px',height:44,
          display:'flex',alignItems:'center',gap:10,flexShrink:0,overflow:'auto'}},
          h('span',{style:{fontSize:12,fontWeight:700,color:'#0d9488',letterSpacing:'0.06em',textTransform:'uppercase',flexShrink:0}},'Git'),
          h('span',{style:{fontSize:14,color:'#0d9488',flexShrink:0}},'🔗'),
          h('span',{style:{fontSize:14,color:'#0f766e',fontFamily:'monospace',fontWeight:500}},
            form.githubRepo+(form.githubFilePath?' / '+form.githubFilePath:'')+(form.githubBranch?' @ '+form.githubBranch:'')),
          h(Button,{icon:h(SyncOutlined),onClick:doPullFromGit,loading:pulling,
            style:{background:'#fff',border:'1px solid #ccfbf1',color:'#0d9488',fontSize:13,flexShrink:0,marginLeft:4}},
            isNew?'從 Git 拉取':'拉取最新'),
          isAdminEdit&&h(Button,{icon:h(EditOutlined),onClick:function(){setGitEditMode(true);},
            style:{background:'#fff',border:'1px solid #ccfbf1',color:'#0d9488',fontSize:13,flexShrink:0}},
            '修改')
        )
      : (isAdminEdit||form.githubRepo)&&h('div',{style:{
          background:'#f8fafc',borderBottom:'1px solid #e2e8f0',
          padding:'0 16px',height:44,
          display:'flex',alignItems:'center',gap:10,flexShrink:0,overflow:'auto'}},
          h('span',{style:{fontSize:12,fontWeight:700,color:'#64748b',letterSpacing:'0.06em',textTransform:'uppercase',flexShrink:0}},'Git（選填）'),
          h(Input,{value:form.githubRepo,onChange:function(e){setField('githubRepo',e.target.value);},
            placeholder:'owner/repo 或 host/ns/project',
            style:{width:280,fontSize:13,background:'#fff',border:'1px solid #cbd5e1',color:'#334155',borderRadius:4},
            prefix:h('span',{style:{color:'#64748b',fontSize:12,marginRight:4,fontWeight:600}},'Repo')}),
          h(Input,{value:form.githubFilePath,onChange:function(e){setField('githubFilePath',e.target.value);},
            placeholder:'docs/file.md',
            style:{width:220,fontSize:13,background:'#fff',border:'1px solid #cbd5e1',color:'#334155',borderRadius:4},
            prefix:h('span',{style:{color:'#64748b',fontSize:12,marginRight:4,fontWeight:600}},'Path')}),
          h(Input,{value:form.githubBranch,onChange:function(e){setField('githubBranch',e.target.value);},
            placeholder:'master',
            style:{width:160,fontSize:13,background:'#fff',border:'1px solid #cbd5e1',color:'#334155',borderRadius:4},
            prefix:h('span',{style:{color:'#64748b',fontSize:12,marginRight:4,fontWeight:600}},'Branch')}),
          form.githubRepo&&h(Button,{onClick:function(){setGitEditMode(false);},
            style:{fontSize:13,flexShrink:0}},'完成')
        ),

    // ── Editor area（flex:1 佔滿剩餘高度）
    h('div',{style:{flex:1,display:'flex',flexDirection:'column',minHeight:0}},
      // Toolbar
      h('div',{style:{
        background:'#fff',borderBottom:'1px solid #e2e8f0',
        padding:'4px 12px',
        display:'flex',alignItems:'center',gap:2,flexShrink:0,flexWrap:'wrap'}},
        // 工具按鈕統一白底風格
        (function(){
          var btnStyle={background:'transparent',border:'1px solid transparent',color:'#475569',
            transition:'all 0.1s',borderRadius:4};
          return [
            h(Tooltip,{title:'粗體 (Cmd+B)'},h(Button,{size:'small',icon:h(BoldOutlined),style:btnStyle,
              onMouseEnter:function(e){e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.color='#1e293b';},
              onMouseLeave:function(e){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#475569';},
              onClick:function(){insertMd('**','**');}})),
            h(Tooltip,{title:'斜體 (Cmd+I)'},h(Button,{size:'small',icon:h(ItalicOutlined),style:btnStyle,
              onMouseEnter:function(e){e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.color='#1e293b';},
              onMouseLeave:function(e){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#475569';},
              onClick:function(){insertMd('_','_');}})),
            h(Tooltip,{title:'底線 (Cmd+U)'},h(Button,{size:'small',icon:h(UnderlineOutlined),style:btnStyle,
              onMouseEnter:function(e){e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.color='#1e293b';},
              onMouseLeave:function(e){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#475569';},
              onClick:function(){insertMd('<u>','</u>');}})),
            h('div',{style:{width:1,height:16,background:'#e2e8f0',margin:'0 4px'}}),
            h(Button,{size:'small',title:'H1',style:Object.assign({},btnStyle,{fontWeight:700,fontSize:11}),
              onMouseEnter:function(e){e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.color='#1e293b';},
              onMouseLeave:function(e){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#475569';},
              onClick:function(){insertMd('# ','');}},'H1'),
            h(Button,{size:'small',title:'H2',style:Object.assign({},btnStyle,{fontWeight:700,fontSize:11}),
              onMouseEnter:function(e){e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.color='#1e293b';},
              onMouseLeave:function(e){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#475569';},
              onClick:function(){insertMd('## ','');}},'H2'),
            h(Button,{size:'small',title:'H3',style:Object.assign({},btnStyle,{fontWeight:700,fontSize:11}),
              onMouseEnter:function(e){e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.color='#1e293b';},
              onMouseLeave:function(e){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#475569';},
              onClick:function(){insertMd('### ','');}},'H3'),
            h('div',{style:{width:1,height:16,background:'#e2e8f0',margin:'0 4px'}}),
            h(Button,{size:'small',icon:h(UnorderedListOutlined),title:'Bullet',style:btnStyle,
              onMouseEnter:function(e){e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.color='#1e293b';},
              onMouseLeave:function(e){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#475569';},
              onClick:function(){insertMd('- ','');}}),
            h(Button,{size:'small',icon:h(OrderedListOutlined),title:'Numbered',style:btnStyle,
              onMouseEnter:function(e){e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.color='#1e293b';},
              onMouseLeave:function(e){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#475569';},
              onClick:function(){insertMd('1. ','');}}),
            h('div',{style:{width:1,height:16,background:'#e2e8f0',margin:'0 4px'}}),
            h(Button,{size:'small',icon:h(LinkOutlined),title:'Link',style:btnStyle,
              onMouseEnter:function(e){e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.color='#1e293b';},
              onMouseLeave:function(e){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#475569';},
              onClick:function(){insertMd('[','](url)');}}),
            h(Button,{size:'small',icon:h(CodeOutlined),title:'Code block',style:btnStyle,
              onMouseEnter:function(e){e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.color='#1e293b';},
              onMouseLeave:function(e){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#475569';},
              onClick:function(){insertMd('```\n','```');}}),
            h(Button,{size:'small',title:'Table',style:btnStyle,
              onMouseEnter:function(e){e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.color='#1e293b';},
              onMouseLeave:function(e){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#475569';},
              onClick:function(){insertMd('\n| 欄位一 | 欄位二 | 欄位三 |\n| ------ | ------ | ------ |\n| ','|\n| 內容 | 內容 | 內容 |');}},'⊞'),
            h('div',{style:{width:1,height:16,background:'#e2e8f0',margin:'0 4px'}}),
            h(Tooltip,{title:'插入圖片（點擊上傳 / 也可直接貼上或拖拉圖片）'},
              h(Button,{size:'small',icon:imgUploading?h(LoadingOutlined):h(PictureOutlined),style:btnStyle,
                disabled:imgUploading,
                onMouseEnter:function(e){e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.color='#1e293b';},
                onMouseLeave:function(e){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#475569';},
                onClick:function(){document.getElementById('dochub-img-input').click();}})
            ),
            h('input',{id:'dochub-img-input',type:'file',accept:'image/*',style:{display:'none'},
              onChange:function(e){var f=e.target.files&&e.target.files[0];if(f)uploadImageFile(f);e.target.value='';}}),
            h(Tooltip,{title:'插入附件（PDF / Word / Excel / PPT / zip，上限 50MB）'},
              h(Button,{size:'small',icon:fileUploading?h(LoadingOutlined):null,style:btnStyle,
                disabled:fileUploading,
                onMouseEnter:function(e){e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.color='#1e293b';},
                onMouseLeave:function(e){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#475569';},
                onClick:function(){document.getElementById('dochub-file-input').click();}},fileUploading?null:'📎')
            ),
            h('input',{id:'dochub-file-input',type:'file',
              accept:'.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.rar,.7z,.md',
              style:{display:'none'},
              onChange:function(e){var f=e.target.files&&e.target.files[0];if(f)uploadAttachmentFile(f);e.target.value='';}}),
          ];
        })(),
        // 右側：字數 + 自動儲存狀態
        h('div',{style:{marginLeft:'auto',display:'flex',alignItems:'center',gap:12}},
          form.content&&h('span',{style:{fontSize:11,color:'#94a3b8',userSelect:'none'}},
            (form.content.trim().split(/\s+/).length||0)+' 字'),
          isDirty
            ?h('span',{style:{fontSize:11,color:'#f59e0b',userSelect:'none'}},'● 未儲存')
            :lastAutoSaved?h('span',{style:{fontSize:11,color:'#94a3b8',userSelect:'none'}},
                '✓ '+lastAutoSaved.toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})):null
        )
      ),

      // ── Split pane（編輯 / 預覽）
      h('div',{style:{flex:1,display:'flex',minHeight:0}},
        // 左：Markdown 編輯器（淺色）
        h('div',{style:{flex:1,display:'flex',flexDirection:'column',borderRight:'1px solid #e2e8f0',background:'#f8fafc'}},
          h('div',{style:{
            padding:'4px 16px',fontSize:10,fontWeight:600,
            color:'#64748b',background:'#f8fafc',
            borderBottom:'1px solid #e2e8f0',letterSpacing:'0.08em',textTransform:'uppercase',height:32,display:'flex',alignItems:'center'}},
            'Markdown'),
          h('textarea',{id:'dochub-editor',value:form.content,
            onChange:function(e){setField('content',e.target.value);},
            onPaste:handleEditorPaste,onDrop:handleEditorDrop,
            onDragOver:function(e){e.preventDefault();},
            style:{
              flex:1,width:'100%',height:'100%',
              fontFamily:'"SF Mono","Fira Code","JetBrains Mono",Consolas,monospace',
              fontSize:13.5,lineHeight:1.75,
              padding:'20px 24px',
              border:'none',resize:'none',outline:'none',
              background:'#f8fafc',color:'#1e293b',
              boxSizing:'border-box',
              caretColor:'#0d9488'},
            placeholder:'Write Markdown here... （可直接貼上或拖入圖片）'})
        ),
        // 右：Preview（白底）
        h('div',{style:{flex:1,display:'flex',flexDirection:'column',background:'#fff'}},
          h('div',{style:{
            padding:'4px 16px',fontSize:10,fontWeight:600,
            color:'#64748b',background:'#f8fafc',
            borderBottom:'1px solid #e2e8f0',letterSpacing:'0.08em',textTransform:'uppercase',height:32,display:'flex',alignItems:'center'}},
            'Preview'),
          form.content
            ?h('div',{key:String(markedReady),className:'dochub-preview',
                style:{flex:1,overflow:'auto',padding:'20px 32px',wordBreak:'break-word',
                  fontFamily:'"Inter","system-ui","Segoe UI",sans-serif'},
                dangerouslySetInnerHTML:{__html:renderMarkdown(form.content)}})
            :h('div',{style:{flex:1,padding:'32px',color:'#94a3b8',fontSize:13,fontStyle:'italic'}},'在左側輸入 Markdown，即時預覽會在這裡顯示...')
        )
      )
    ),

    // ── Modals（不變，只更新樣式）
    h(Modal,{
      title:h('span',null,h(ExclamationCircleOutlined,{style:{color:'#faad14',marginRight:8}}),'Git 同步確認'),
      open:showSync,onCancel:function(){setShowSync(false);},width:680,
      footer:h(Space,null,
        h(Button,{onClick:function(){setShowSync(false);}},'取消'),
        h(Button,{type:'primary',danger:true,loading:syncing,icon:h(SyncOutlined),onClick:handleSyncConfirm},'確認推送')
      )},
      h(Alert,{message:'此操作不可逆，將覆蓋 Git 上的同名檔案。',type:'warning',showIcon:true,style:{marginBottom:16}}),
      h('div',{style:{background:'#1e1e1e',borderRadius:6,padding:16,fontFamily:'monospace',fontSize:12,maxHeight:220,overflow:'auto'}},
        diffLines.map(function(line,i){
          var color=line.startsWith('+')&&!line.startsWith('+++')?'#4caf50':line.startsWith('-')&&!line.startsWith('---')?'#f44336':line.startsWith('@@')?'#64b5f6':'#ccc';
          return h('div',{key:i,style:{color:color}},line);
        })
      )
    ),
    h(Modal,{
      title:'儲存備註',
      open:!!showSaveModal,
      onCancel:function(){setShowSaveModal(false);setSaving(false);},
      width:440,
      footer:h(Space,null,
        h(Button,{onClick:function(){setShowSaveModal(false);setSaving(false);}},'取消'),
        h(Button,{type:'primary',loading:saving,disabled:!btnReady,
          style:{background:'#0d9488',borderColor:'#0d9488'},
          onClick:function(){doSave(changeSummary,showSaveModal==='published'?'published':undefined);}},
          showSaveModal==='published'?'發布':'儲存')
      )},
      h('div',{style:{marginBottom:8,color:'#64748b',fontSize:13}},'選填：這次修改了什麼？（留空則顯示版本號）'),
      h(Input.TextArea,{value:changeSummary,onChange:function(e){setChangeSummary(e.target.value);},
        placeholder:'例：修正錯字、新增 API 範例...',maxLength:300,autoFocus:true,
        rows:4,autoSize:{minRows:3,maxRows:8}})
    ),
    h(Modal,{
      title:h('span',null,h(ExclamationCircleOutlined,{style:{color:'#faad14',marginRight:8}}),'GitHub 版本衝突'),
      open:showConflict,onCancel:function(){setShowConflict(false);},width:480,
      footer:h(Space,null,
        h(Button,{onClick:function(){setShowConflict(false);}},'取消'),
        h(Button,{type:'primary',danger:true,loading:pulling,icon:h(SyncOutlined),onClick:doPullFromGit},'同步 GitHub 最新版本')
      )},
      h(Alert,{type:'warning',showIcon:true,message:'此文件的 GitHub 版本已有更新',
        description:'有人在 GitHub 上更新了這份文件。請先同步 GitHub 最新版本，再重新編輯後儲存。同步後你的未儲存變更將會遺失。',
        style:{marginBottom:0}})
    )
  );
}


function VersionPage(){
  var params=useParams();
  var docId=params.id;
  var navigate=useNavigate();
  var client=useAPIClient();
  var currentUser=useCurrentUser();
  var _v=useState([]);var versions=_v[0];var setVersions=_v[1];
  var _l=useState(true);var loading=_l[0];var setLoading=_l[1];
  var _sel=useState(null);var selected=_sel[0];var setSelected=_sel[1];
  var _editId=useState(null);var editingVerId=_editId[0];var setEditingVerId=_editId[1];
  var _editVal=useState('');var editingVal=_editVal[0];var setEditingVal=_editVal[1];
  var _saving=useState(false);var summSaving=_saving[0];var setSummSaving=_saving[1];
  var _dl=useDoc(docId);var doc=_dl.doc;
  var cu=(currentUser&&(currentUser.data||currentUser))||null;
  var cuId=cu&&(cu.id||cu.data&&cu.data.id);
  var isAdminUser=cuId&&(Number(cuId)===1||(cu.roles&&cu.roles.some&&cu.roles.some(function(r){return r.name==='root'||r.name==='admin';})));

  function canEditSummary(ver){
    if(isAdminUser)return true;
    return ver.editorId&&cuId&&Number(ver.editorId)===Number(cuId);
  }

  function startEditSummary(e,ver){
    e.stopPropagation();
    setEditingVerId(ver.id);
    setEditingVal(ver.changeSummary||'');
  }

  function saveSummary(ver){
    if(!client)return;
    setSummSaving(true);
    client.request({url:'docVersions:updateSummary',method:'post',params:{filterByTk:ver.id},data:{changeSummary:editingVal}})
      .then(function(){
        setVersions(function(vs){return vs.map(function(v){return v.id===ver.id?Object.assign({},v,{changeSummary:editingVal}):v;});});
        if(selected&&selected.id===ver.id)setSelected(function(s){return Object.assign({},s,{changeSummary:editingVal});});
        setEditingVerId(null);setSummSaving(false);
      })
      .catch(function(err){
        var msg=err&&err.response&&err.response.data&&err.response.data.errors&&err.response.data.errors[0]&&err.response.data.errors[0].message;
        message.error(msg||'儲存失敗');setSummSaving(false);
      });
  }

  useEffect(function(){
    if(!client||!docId||docId==='new')return;
    setLoading(true);
    client.request({url:'docVersions:list',method:'get',params:{
      filter:{documentId:docId},sort:['-versionNumber'],pageSize:50,
      appends:['editor']
    }})
      .then(function(res){
        var rows=(res.data&&res.data.data)||[];
        setVersions(rows);
        if(rows.length>0)setSelected(rows[0]);
        setLoading(false);
      })
      .catch(function(){setLoading(false);});
  },[docId,client]);

  // 找前一版本（版本號比 selected 小一）
  var prevVersion=selected
    ?versions.find(function(v){return v.versionNumber===selected.versionNumber-1;})
    :null;

  // 解析 server 端產生的 diffPatch（每行前綴 '+'/'-'/' '）
  // v1 沒有 diffPatch，視為全部新增
  var diffLines=selected
    ?(selected.diffPatch
      ?selected.diffPatch.split('\n').map(function(line){
          var prefix=line.charAt(0);
          return {type:prefix==='+'?'add':prefix==='-'?'remove':'equal',text:line.slice(1)};
        })
      :(selected.content||'').split('\n').map(function(l){return {type:'add',text:l};}))
    :[];

  // 統計
  var addCount=diffLines.filter(function(l){return l.type==='add';}).length;
  var removeCount=diffLines.filter(function(l){return l.type==='remove';}).length;

  return h('div',{style:{minHeight:'100vh',background:'#f5f5f5',display:'flex',flexDirection:'column'}},
    // Header
    h('div',{style:{background:'#fff',borderBottom:'1px solid #f0f0f0',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}},
      h(Space,null,
        h(Button,{icon:h(ArrowLeftOutlined),onClick:function(){navigate('/admin/doc-hub/view/'+docId);}},'返回文件'),
        h('span',{style:{fontWeight:600,fontSize:15}},(doc&&doc.title)||'文件'),' — ',
        h('span',{style:{color:'#73808c',fontSize:14}},'版本歷史')
      ),
      h(Tag,{icon:h(HistoryOutlined),color:'blue'},versions.length+' 個版本')
    ),
    h('div',{style:{display:'flex',flex:1,height:'calc(100vh - 57px)'}},
      // 左側：版本列表
      h('div',{style:{width:260,background:'#fff',borderRight:'1px solid #f0f0f0',overflow:'auto',flexShrink:0}},
        loading
          ?h('div',{style:{textAlign:'center',padding:40}},h(Spin))
          :versions.length===0
            ?h(Empty,{description:'尚無版本記錄',style:{padding:40}})
            :versions.map(function(ver){
              var isSel=selected&&selected.id===ver.id;
              var editor=ver.editor;
              var editorName=editor?(editor.nickname||editor.username||editor.email):'未知';
              return h('div',{key:ver.id,onClick:function(){setSelected(ver);},
                style:{padding:'12px 16px',cursor:'pointer',
                  background:isSel?'#e6f4ff':'transparent',
                  borderLeft:isSel?'3px solid #1677ff':'3px solid transparent',
                  borderBottom:'1px solid #f5f5f5'}},
                h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}},
                  h(Tag,{color:'blue',style:{margin:0}},'v'+ver.versionNumber),
                  h('span',{style:{fontSize:11,color:'#8c99ad'}},
                    ver.createdAt?new Date(ver.createdAt).toLocaleString('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'-'
                  )
                ),
                h('div',{style:{fontSize:12,color:'#73808c',marginTop:2}},
                  h(UserOutlined,{style:{marginRight:4,fontSize:11}}),editorName
                ),
                editingVerId===ver.id
                  ?h('div',{style:{marginTop:6},onClick:function(e){e.stopPropagation();}},
                    h(Input.TextArea,{
                      value:editingVal,
                      onChange:function(e){setEditingVal(e.target.value);},
                      autoSize:{minRows:2,maxRows:6},
                      placeholder:'輸入版本摘要…',
                      style:{fontSize:11,marginBottom:4}
                    }),
                    h('div',{style:{display:'flex',gap:4,justifyContent:'flex-end'}},
                      h(Button,{size:'small',onClick:function(e){e.stopPropagation();setEditingVerId(null);}}, '取消'),
                      h(Button,{size:'small',type:'primary',loading:summSaving,onClick:function(e){e.stopPropagation();saveSummary(ver);}}, '儲存')
                    )
                  )
                  :h('div',{style:{marginTop:3,display:'flex',alignItems:'flex-start',gap:4}},
                    (ver.changeSummary||canEditSummary(ver))&&h('div',{style:{flex:1,fontSize:11,color:'#a0aab5',whiteSpace:'pre-wrap',wordBreak:'break-word'}},
                      ver.changeSummary||(canEditSummary(ver)?h('span',{style:{color:'#c0c8d0',fontStyle:'italic'}},'點擊鉛筆新增摘要'):null)
                    ),
                    canEditSummary(ver)&&h(Button,{
                      type:'text',size:'small',
                      icon:h(EditOutlined),
                      style:{padding:'0 2px',height:16,minWidth:16,fontSize:11,color:'#bbb',flexShrink:0},
                      onClick:function(e){startEditSummary(e,ver);}
                    })
                  )
              );
            })
      ),
      // 右側：diff
      h('div',{style:{flex:1,overflow:'auto',background:'#fafafa'}},
        selected
          ?h('div',{style:{padding:'20px 24px'}},
              // diff header
              h('div',{style:{display:'flex',alignItems:'center',gap:12,marginBottom:16}},
                h('span',{style:{fontWeight:600,fontSize:14,color:'#1a1f26'}},'v'+selected.versionNumber),
                prevVersion
                  ?h('span',{style:{color:'#73808c',fontSize:13}},'對比 v'+prevVersion.versionNumber)
                  :h('span',{style:{color:'#73808c',fontSize:13}},'（初始版本）'),
                h('span',{style:{marginLeft:8}},
                  h(Tag,{color:'green',style:{fontSize:11}},'+'+addCount+' 行'),
                  h(Tag,{color:'red',style:{fontSize:11}},'-'+removeCount+' 行')
                )
              ),
              // diff body — GitHub dark palette，WCAG AA 對比度
              h('div',{style:{background:'#0d1117',border:'1px solid #30363d',borderRadius:8,overflow:'auto',fontFamily:'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',fontSize:13,lineHeight:1.7}},
                diffLines.length===0
                  ?h('div',{style:{padding:24,color:'#8b949e',textAlign:'center'}},'（無變更）')
                  :diffLines.map(function(line,i){
                      // add: #3fb950 綠 + 15% alpha bg；remove: #f85149 紅 + 15% alpha bg
                      var bg=line.type==='add'?'rgba(63,185,80,0.15)':line.type==='remove'?'rgba(248,81,73,0.15)':'transparent';
                      var color=line.type==='add'?'#3fb950':line.type==='remove'?'#f85149':'#c9d1d9';
                      var prefix=line.type==='add'?'+ ':line.type==='remove'?'- ':'  ';
                      return h('div',{key:i,style:{padding:'2px 16px',background:bg,whiteSpace:'pre-wrap',wordBreak:'break-all'}},
                        h('span',{style:{color:color,userSelect:'none',marginRight:4,fontWeight:600}},prefix),
                        h('span',{style:{color:color}},line.text)
                      );
                    })
              )
            )
          :h('div',{style:{textAlign:'center',padding:80,color:'#999'}},'選擇版本查看 Diff')
      )
    )
  );
}

// ── ViewPage（閱讀模式）────────────────────────────────────────────────────────
function ViewPage(){
  var params=useParams();
  var docId=params.id;
  var navigate=useNavigate();
  var _dl=useDoc(docId);var doc=_dl.doc;var loading=_dl.loading;
  var currentUser=useCurrentUser();
  var client=useAPIClient();
  var _mr=useState(!!window.marked);var markedReady=_mr[0];var setMarkedReady=_mr[1];
  var _vtpl=useState(null);var viewTpl=_vtpl[0];var setViewTpl=_vtpl[1];
  var _prog=useState(0);var readProgress=_prog[0];var setReadProgress=_prog[1];

  // Load template def if content is template format
  useEffect(function(){
    if(!doc||!doc.content||!isTemplateContent(doc.content))return;
    var parsed=parseTemplateContent(doc.content);
    if(!parsed||!parsed.templateId)return;
    client.request({url:'docTemplates:get',method:'get',params:{filterByTk:parsed.templateId}})
      .then(function(r){setViewTpl(r.data&&r.data.data||null);})
      .catch(function(){setViewTpl(null);});
  },[doc]);

  useEffect(function(){
    loadMarked(function(){setMarkedReady(true);});
    // 更新 dochub-md-style
    var existing=document.getElementById('dochub-md-style');
    if(existing)existing.remove();
    var st=document.createElement('style');
    st.id='dochub-md-style';
    st.textContent=[
      '.dochub-preview{font-size:15.5px;line-height:1.85;color:#334155;word-wrap:break-word;overflow-wrap:break-word}',
      '.dochub-preview h1{font-size:26px;font-weight:700;color:#1e293b;margin:48px 0 16px;padding-bottom:10px;border-bottom:1px solid #e2e8f0;letter-spacing:-0.01em;line-height:1.35}',
      '.dochub-preview h2{font-size:22px;font-weight:700;color:#1e293b;margin:40px 0 14px;padding-bottom:8px;border-bottom:1px solid #f1f5f9;letter-spacing:-0.01em;line-height:1.35}',
      '.dochub-preview h3{font-size:18px;font-weight:600;color:#1e293b;margin:32px 0 12px;line-height:1.4}',
      '.dochub-preview h4{font-size:15.5px;font-weight:600;color:#475569;margin:24px 0 8px;line-height:1.5}',
      '.dochub-preview p{margin:0 0 16px;color:#334155}',
      '.dochub-preview a{color:#0d9488;text-decoration:none;border-bottom:1px solid transparent;transition:border-color 0.15s}',
      '.dochub-preview a:hover{border-bottom-color:#0d9488}',
      '.dochub-preview code{font-family:"SF Mono","Fira Code","JetBrains Mono",Consolas,monospace;font-size:0.88em;padding:2px 6px;border-radius:4px;background:#f0fdfa;color:#0f766e;border:1px solid #ccfbf1}',
      '.dochub-preview pre{margin:20px 0;padding:20px 24px;border-radius:8px;background:#1e293b;overflow-x:auto;border:1px solid #334155}',
      '.dochub-preview pre code{font-size:13.5px;line-height:1.7;padding:0;background:transparent;color:#e2e8f0;border:none;border-radius:0}',
      '.dochub-preview blockquote{margin:20px 0;padding:14px 20px;border-left:3px solid #0d9488;background:#f0fdfa;border-radius:0 6px 6px 0;color:#475569}',
      '.dochub-preview blockquote p{margin:0;color:#475569}',
      '.dochub-preview ul,.dochub-preview ol{margin:12px 0;padding-left:24px}',
      '.dochub-preview li{margin:6px 0;line-height:1.75}',
      '.dochub-preview li::marker{color:#94a3b8}',
      '.dochub-preview table{width:100%;margin:20px 0;border-collapse:collapse;font-size:14px;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0}',
      '.dochub-preview th{padding:10px 14px;text-align:left;font-weight:600;font-size:12.5px;text-transform:uppercase;letter-spacing:0.04em;color:#64748b;background:#f8fafc;border-bottom:1px solid #e2e8f0}',
      '.dochub-preview td{padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#475569}',
      '.dochub-preview tr:last-child td{border-bottom:none}',
      '.dochub-preview tr:hover td{background:#f8fafc}',
      '.dochub-preview hr{margin:32px 0;border:none;height:1px;background:#e2e8f0}',
      '.dochub-preview img{max-width:100%;height:auto;border-radius:8px;margin:16px 0;border:1px solid #e2e8f0}',
      '.dochub-preview ::selection{background:#ccfbf1;color:#0f766e}',
      '.dochub-toc-item:hover{color:#0d9488!important}',
      '@media print{.dochub-no-print{display:none!important}.dochub-preview{font-size:13px}}'
    ].join('\n');
    document.head.appendChild(st);
    // 閱讀進度條（NocoBase 頁面滾動容器可能是內部 div，用 capture:true 攔截所有滾動）
    function onScroll(e){
      var el=e&&e.target&&e.target.scrollHeight>e.target.clientHeight?e.target:document.documentElement;
      var scrolled=el.scrollTop||document.body.scrollTop;
      var total=(el.scrollHeight||1)-(el.clientHeight||1);
      setReadProgress(total>0?Math.min(100,Math.round(scrolled/total*100)):0);
    }
    window.addEventListener('scroll',onScroll,{passive:true,capture:true});
    return function(){window.removeEventListener('scroll',onScroll,{capture:true});};
  },[]);

  // 最近查看記錄
  useEffect(function(){
    if(!doc)return;
    try{
      var key='dochub_recent';
      var existing=JSON.parse(localStorage.getItem(key)||'[]');
      var entry={id:docId,title:doc.title||'（無標題）',ts:Date.now(),projectId:doc.projectId,categoryId:doc.categoryId,projectName:(doc.project&&doc.project.name)||'',categoryName:(doc.category&&doc.category.name)||''};
      var filtered2=existing.filter(function(x){return String(x.id)!==String(docId);});
      filtered2.unshift(entry);
      if(filtered2.length>8)filtered2=filtered2.slice(0,8);
      localStorage.setItem(key,JSON.stringify(filtered2));
    }catch(e){}
  },[doc]);

  if(loading||!currentUser)return h('div',{style:{textAlign:'center',padding:80}},h(Spin));

  // 權限判斷（含專案層級階層：viewer ⊂ subscriber ⊂ editor）
  var isAdmin=currentUser.id===1||!!(currentUser.roles&&currentUser.roles.some(function(r){return r.name==='root'||r.name==='admin';}));
  var viewers=doc&&doc.viewers||[];
  var editors=doc&&doc.editors||[];
  var projViewers=(doc&&doc.project&&doc.project.viewers)||[];
  var projEditors=(doc&&doc.project&&doc.project.editors)||[];
  var projSubs=(doc&&doc.project&&doc.project.subscribers)||[];
  var hasIn=function(arr){return arr.some(function(v){return v.id===currentUser.id;});};
  var canView=isAdmin
    ||!!(doc&&doc.authorId===currentUser.id)
    ||hasIn(viewers)||hasIn(editors)
    ||hasIn(projViewers)||hasIn(projSubs)||hasIn(projEditors);
  var canEdit=isAdmin
    ||!!(doc&&doc.authorId===currentUser.id)
    ||hasIn(editors)
    ||hasIn(projEditors);
  var isLocked=!!(doc&&doc.locked);

  if(doc&&!canView){
    return h('div',{style:{minHeight:'100vh',background:'#fcfcfd',display:'flex',alignItems:'center',justifyContent:'center'}},
      h('div',{style:{textAlign:'center'}},
        h('div',{style:{fontSize:56,marginBottom:16}},'🔒'),
        h('div',{style:{fontSize:20,fontWeight:700,color:'#1e293b',marginBottom:8}},'無法存取此文件'),
        h('div',{style:{color:'#64748b',marginBottom:28,fontSize:15}},'你沒有查看此文件的權限'),
        h(Button,{size:'large',onClick:function(){navigate('/admin/doc-hub');}},'返回列表')
      )
    );
  }

  var isTemplatDoc=doc&&doc.content&&isTemplateContent(doc.content);
  var headings=doc&&doc.content&&!isTemplatDoc?(doc.content.match(/^#{1,6}\s+.+/gm)||[]):[];
  var showToc=headings.length>=2&&typeof window!=='undefined'&&window.innerWidth>=1024;

  // 格式化時間
  var updatedStr=doc&&doc.updatedAt?new Date(doc.updatedAt).toLocaleString('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):null;
  var editorName=doc&&doc.lastEditor?(doc.lastEditor.nickname||doc.lastEditor.username||doc.lastEditor.email):null;

  return h('div',{style:{minHeight:'100vh',background:'#fcfcfd',display:'flex',flexDirection:'column'}},
    // 閱讀進度條 — teal 漸層
    h('div',{className:'dochub-no-print',style:{position:'fixed',top:46,left:0,width:readProgress+'%',height:3,
      background:'linear-gradient(90deg,#0d9488 0%,#2dd4bf 100%)',
      zIndex:9999,transition:'width 0.15s ease-out',pointerEvents:'none',borderRadius:'0 2px 2px 0'}}),

    // ── Header bar（毛玻璃）
    h('div',{className:'dochub-no-print',style:{
      position:'sticky',top:0,zIndex:1000,
      display:'flex',alignItems:'center',justifyContent:'space-between',
      padding:'0 32px',height:52,
      background:'rgba(252,252,253,0.85)',
      backdropFilter:'blur(12px)',
      WebkitBackdropFilter:'blur(12px)',
      borderBottom:'1px solid #e2e8f0'}},
      // 左側：返回 + 狀態 pills
      h('div',{style:{display:'flex',alignItems:'center',gap:10}},
        h(Button,{icon:h(ArrowLeftOutlined),size:'small',
          style:{border:'1px solid #e2e8f0',background:'#fff',color:'#475569',fontSize:13},
          onClick:function(){var qs='';if(doc&&doc.projectId)qs+='?projectId='+doc.projectId;if(doc&&doc.categoryId)qs+=(qs?'&':'?')+'categoryId='+doc.categoryId;navigate('/admin/doc-hub'+qs);}},'返回'),
        doc&&h('span',{style:{
          display:'inline-flex',alignItems:'center',gap:4,
          padding:'2px 10px',borderRadius:10,fontSize:12,fontWeight:500,lineHeight:'20px',
          background:doc.status==='published'?'#ecfdf5':'#fffbeb',
          color:doc.status==='published'?'#059669':'#d97706',
          border:'1px solid '+(doc.status==='published'?'#a7f3d0':'#fde68a')}},
          doc.status==='published'?'● 已發布':'○ 草稿'),
        isLocked&&h('span',{style:{
          display:'inline-flex',alignItems:'center',gap:4,
          padding:'2px 10px',borderRadius:10,fontSize:12,fontWeight:500,lineHeight:'20px',
          background:'#fef3c7',color:'#b45309',border:'1px solid #fde68a'}},'🔒 已鎖定')
      ),
      // 右側：次要操作 + 主要操作
      h('div',{style:{display:'flex',alignItems:'center',gap:8}},
        h(Tooltip,{title:'版本歷史'},
          h(Button,{icon:h(HistoryOutlined),size:'small',
            style:{border:'1px solid #e2e8f0',background:'#fff',color:'#475569'},
            onClick:function(){navigate('/admin/doc-hub/versions/'+docId);}},'版本歷史')
        ),
        h(Tooltip,{title:'列印 / 匯出 PDF'},
          h(Button,{icon:h(FileTextOutlined),size:'small',
            style:{border:'1px solid #e2e8f0',background:'#fff',color:'#475569'},
            onClick:function(){window.print();}},'列印')
        ),
        canEdit&&h(Tooltip,{title:isLocked?'文件已鎖定，請聯繫管理員解鎖後才能編輯':null},
          h(Button,{type:'primary',size:'small',icon:h(EditOutlined),disabled:isLocked,
            style:{background:'#0d9488',borderColor:'#0d9488'},
            onClick:function(){
              if(doc&&doc.content&&isTemplateContent(doc.content)){
                navigate('/admin/doc-hub/template-fill/'+docId);
              } else {
                navigate('/admin/doc-hub/edit/'+docId);
              }
            }},'編輯')
        )
      )
    ),

    // ── Hero 區（漸層背景，含標題 + meta）
    doc&&h('div',{style:{
      background:'linear-gradient(135deg,#f0fdfa 0%,#e0f2fe 60%,#f0fdfa 100%)',
      borderBottom:'1px solid #e2e8f0',
      padding:'44px 0 36px'}},
      h('div',{style:{maxWidth:1100,margin:'0 auto',padding:'0 32px'}},
        // breadcrumb 風格小字（專案 + 資料夾）
        h('div',{style:{display:'flex',alignItems:'center',gap:6,marginBottom:14,fontSize:13,color:'#94a3b8'}},
          h('span',null,'Doc Hub'),
          doc.project&&h('span',null,'›'),
          doc.project&&h('span',{style:{color:'#64748b'}},doc.project.name),
          doc.category&&h('span',null,'›'),
          doc.category&&h('span',{style:{color:'#64748b'}},doc.category.name)
        ),
        // 大標題
        h('h1',{style:{
          fontSize:32,fontWeight:800,color:'#1e293b',
          lineHeight:1.25,letterSpacing:'-0.02em',
          margin:'0 0 22px',maxWidth:860}},
          doc.title||'（無標題）'
        ),
        // Meta row
        h('div',{style:{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}},
          updatedStr&&h('span',{style:{display:'inline-flex',alignItems:'center',gap:5,fontSize:13,color:'#64748b'}},
            h('span',{style:{opacity:0.5,fontSize:12}},'🕐'),updatedStr),
          editorName&&h('span',{style:{display:'inline-flex',alignItems:'center',gap:5,fontSize:13,color:'#64748b'}},
            h(UserOutlined,{style:{fontSize:12,opacity:0.5}}),editorName)
        ),
        // Tag row
        doc.tags&&doc.tags.length>0&&h('div',{style:{marginTop:10,display:'flex',flexWrap:'wrap',gap:6,alignItems:'center'}},
          h('span',{style:{fontSize:12,color:'#94a3b8',marginRight:2}},'🏷'),
          doc.tags.map(function(t){
            return h(Tag,{key:t.id,color:t.color||'default',style:{cursor:'pointer',fontSize:12,borderRadius:4,margin:0},
              onClick:function(){navigate('/admin/doc-hub?tags='+encodeURIComponent(t.name));}},t.name);
          })
        )
      )
    ),

    // ── 主內容區（Markdown + TOC）
    h('div',{style:{
      maxWidth:1100,width:'100%',margin:'0 auto',
      padding:'36px 32px 80px',
      flex:1,display:'flex',gap:52,alignItems:'flex-start'}},

      // 主內容
      h('div',{style:{flex:1,minWidth:0,maxWidth:860}},
        doc
          ? (doc.content&&isTemplateContent(doc.content)
              ? h(TemplateFormViewer,{doc:doc,tpl:viewTpl})
              : doc.content
                ? h('div',{key:String(markedReady),className:'dochub-preview',
                    style:{fontFamily:'"Inter","system-ui","Segoe UI",sans-serif',wordBreak:'break-word'},
                    dangerouslySetInnerHTML:{__html:renderMarkdown(doc.content)}})
                : h('div',{style:{color:'#94a3b8',fontSize:15,padding:'60px 0',textAlign:'center',fontStyle:'italic'}},'（此文件尚無內容）')
            )
          : h('div',{style:{textAlign:'center',padding:80,color:'#94a3b8'}},'文件不存在')
      ),

      // TOC 側欄
      showToc&&h('div',{style:{
        width:192,flexShrink:0,
        position:'sticky',top:80,
        maxHeight:'calc(100vh - 120px)',
        overflowY:'auto',
        scrollbarWidth:'none',
        msOverflowStyle:'none'}},
        h('div',{style:{
          fontSize:11,fontWeight:600,textTransform:'uppercase',
          letterSpacing:'0.08em',color:'#94a3b8',
          padding:'0 0 10px 14px',marginBottom:2}},
          '目錄'),
        h('div',{style:{borderLeft:'1px solid #e2e8f0'}},
          headings.map(function(raw,i){
            var level=raw.match(/^(#+)/)[1].length;
            var text=raw.replace(/^#+\s+/,'');
            return h('a',{key:i,
              className:'dochub-toc-item',
              title:text,
              style:{
                display:'block',
                padding:'5px 12px 5px '+(12+(level-1)*12)+'px',
                fontSize:level===1?13:12.5,
                color:'#64748b',
                textDecoration:'none',
                cursor:'pointer',
                lineHeight:1.5,
                marginLeft:-1,
                borderLeft:'2px solid transparent',
                transition:'color 0.15s,border-color 0.15s',
                overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},
              onClick:function(e){
                e.preventDefault();
                var tag='h'+level;
                var els=document.querySelectorAll('.dochub-preview '+tag);
                for(var j=0;j<els.length;j++){
                  if(els[j].textContent.trim()===text){
                    els[j].scrollIntoView({behavior:'smooth',block:'start'});
                    break;
                  }
                }
              }},
              text
            );
          })
        )
      )
    )
  );
}

function gp(e){return(gp=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}
function sp(e,t){return(sp=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}
function isNR(){try{var e=!Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){}))}catch(e){}return(isNR=function(){return!!e})()}

var DocHubPlugin=function(Base){
  if("function"!=typeof Base&&null!==Base)throw TypeError("Super expression must either be null or a function");
  function DocHubPlugin(){
    var _this,superArgs;
    if(!(this instanceof DocHubPlugin))throw TypeError("Cannot call a class as a function");
    _this=DocHubPlugin,superArgs=arguments,_this=gp(_this);
    var result=isNR()?Reflect.construct(_this,superArgs||[],gp(this).constructor):_this.apply(this,superArgs);
    if(result&&("object"==typeof result||"function"==typeof result))return result;
    if(void 0===this)throw ReferenceError("this hasn't been initialised");
    return this;
  }
  DocHubPlugin.prototype=Object.create(Base&&Base.prototype,{constructor:{value:DocHubPlugin,writable:!0,configurable:!0}});
  Base&&sp(DocHubPlugin,Base);
  DocHubPlugin.prototype.load=function(){
    var self=this;
    return Promise.resolve().then(function(){
      // Use unique flat names so they are siblings (not nested) under admin
      self.app.router.add('admin.doc-hub',{path:'/admin/doc-hub',Component:ListPage});
      self.app.router.add('admin.dochub-view',{path:'/admin/doc-hub/view/:id',Component:ViewPage});
      self.app.router.add('admin.dochub-edit',{path:'/admin/doc-hub/edit/:id',Component:EditPage});
      self.app.router.add('admin.dochub-versions',{path:'/admin/doc-hub/versions/:id',Component:VersionPage});
      self.app.router.add('admin.dochub-template-fill',{path:'/admin/doc-hub/template-fill/:id',Component:TemplateFillPage});
      self.app.router.add('admin.dochub-templates',{path:'/admin/doc-hub/templates',Component:TemplateListPage});
      self.app.router.add('admin.dochub-tags',{path:'/admin/doc-hub/tags',Component:TagManagerPage});
      console.log('[DocHub] routes registered');
    });
  };
  return DocHubPlugin;
}(Plugin);

}(),exports$}()});
