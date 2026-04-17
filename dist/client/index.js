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
    return window.DOMPurify.sanitize(html,{USE_PROFILES:{html:true}});
  }
  // fallback：沒有 DOMPurify 時純文字顯示
  return html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+on\w+\s*=/gi,'');
}
function renderMarkdown(md){
  if(!md)return'';
  var parse=getMarkedParse();
  if(parse)return sanitizeHtml(parse(md));
  // fallback
  return md.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br/>');
}

function useDocList(qSearch,qCategoryId,qTypeId,qStatus,qProjectId){
  var client=useAPIClient();
  var _d=useState([]);var data=_d[0];var setData=_d[1];
  var _l=useState(true);var loading=_l[0];var setLoading=_l[1];
  var reload=useCallback(function(){
    if(!client)return;
    setLoading(true);
    var useSearch=!!qSearch;
    var url=useSearch?'docDocuments:search':'docDocuments:list';
    var params={pageSize:200,sort:useSearch?['-updatedAt']:['sort','-updatedAt'],appends:['category','type','lastEditor']};
    if(useSearch){
      params.q=qSearch;
      if(qCategoryId)params.categoryId=qCategoryId;
      if(qTypeId)params.typeId=qTypeId;
      if(qStatus&&qStatus!=='all')params.status=qStatus;
      if(qProjectId)params.projectId=qProjectId;
    } else {
      var filter={};
      if(qCategoryId)filter.categoryId=qCategoryId;
      if(qTypeId)filter.typeId=qTypeId;
      if(qStatus&&qStatus!=='all')filter.status=qStatus;
      if(qProjectId)filter.projectId=qProjectId;
      if(Object.keys(filter).length)params.filter=filter;
    }
    client.request({url:url,method:'get',params:params})
      .then(function(res){
        var d=res.data&&res.data.data;
        setData(Array.isArray(d)?d:[]);
        setLoading(false);
      })
      .catch(function(){setLoading(false);});
  },[client,qSearch,qCategoryId,qTypeId,qStatus,qProjectId]);
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
    client.request({url:'docDocuments:get',method:'get',params:{filterByTk:id,appends:['viewers','editors','subscribers','type','lastEditor']}})
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
  var DEFAULT_FOLDERS=[{name:'SRS'},{name:'SDS'},{name:'SPEC'},{name:'PM-Doc'},{name:'Others'},{name:'上版單'}];
  var _cpf=useState(DEFAULT_FOLDERS.map(function(f){return f.name;}));var projFolders=_cpf[0];var setProjFolders=_cpf[1];

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
    client.request({url:'docCategories:list',method:'get',params:{pageSize:100,sort:['sort']}})
      .then(function(res){setCats((res.data&&res.data.data)||[]);});
  }

  useEffect(function(){loadSidebar();},[client]);

  function toggleExpand(id){
    setExpanded(function(e){var n=Object.assign({},e);n[id]=!n[id];return n;});
  }
  function toggleGroupExpand(id){
    setGroupExpanded(function(e){var n=Object.assign({},e);n[id]=e[id]===false?true:false;return n;});
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
    var validFolders=projFolders.filter(function(n){return n&&n.trim();}).map(function(n,i){return{name:n.trim(),sort:i};});
    client.request({url:'docProjects:create',method:'post',data:{
      name:newProjName.trim(),
      description:newProjDesc.trim()||undefined,
      groupId:selectedProjGroupId,
      folders:validFolders
    }})
      .then(function(){
        message.success('專案建立成功');
        setCreateProjGroupId(null);setSelectedProjGroupId(null);setNewProjName('');setNewProjDesc('');setCreatingProj(false);
        setProjFolders(DEFAULT_FOLDERS.map(function(f){return f.name;}));
        loadSidebar();
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
    var children = cats.filter(function(c){return c.projectId===projId && c.parentId===parentId;});
    if(children.length===0) return null;
    return children.map(function(cat){
      var subCats=cats.filter(function(c){return c.parentId===cat.id;});
      var hasChildren=subCats.length>0;
      var isActive=String(activeCatId)===String(cat.id);
      var isExp=expanded[cat.id]!==false; // 預設展開，false 才收起
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
    var isProjExp=expandedProj[proj.id]!==false; // 預設展開
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
    // Logo + collapse toggle
    h('div',{style:{padding:'16px 12px 10px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}},
      !collapsed&&h('div',{style:{display:'flex',alignItems:'center',gap:8,overflow:'hidden'}},
        h('div',{style:{fontSize:22,fontWeight:800,color:'#fff',cursor:'pointer',letterSpacing:'-0.5px',lineHeight:1,whiteSpace:'nowrap'},
          onClick:function(){navigate('/admin/doc-hub');}
        },'DocHub'),
        h('div',{style:{fontSize:10,background:'rgba(22,136,255,0.35)',color:'#7ab8ff',
          borderRadius:4,padding:'2px 6px',fontWeight:700,letterSpacing:'0.5px',whiteSpace:'nowrap'}},'BETA')
      ),
      h('div',{
        title:collapsed?'展開側欄':'收合側欄',
        onClick:function(){setCollapsed(function(c){return !c;});},
        style:{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
          borderRadius:6,color:'#6b8299',fontSize:16,flexShrink:0,
          transition:'all 0.15s',background:'rgba(255,255,255,0.04)'},
        onMouseEnter:function(e){e.currentTarget.style.background='rgba(255,255,255,0.1)';e.currentTarget.style.color='#fff';},
        onMouseLeave:function(e){e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.color='#6b8299';}
      },collapsed?'»':'«')
    ),
    // Collapsed mode: 只顯示簡易 icon nav
    collapsed&&h('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'8px 0',flex:1}},
      h('div',{title:'全部文件',onClick:function(){onSelectProject(null);onSelectCat(null);setCollapsed(false);},
        style:{width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
          borderRadius:8,fontSize:20,color:(!activeProjectId&&!activeCatId)?'#fff':'#6b8299',
          background:(!activeProjectId&&!activeCatId)?'rgba(22,136,255,0.2)':'transparent',transition:'all 0.12s'},
        onMouseEnter:function(e){e.currentTarget.style.background='rgba(255,255,255,0.08)';},
        onMouseLeave:function(e){e.currentTarget.style.background=(!activeProjectId&&!activeCatId)?'rgba(22,136,255,0.2)':'transparent';}
      },'📋'),
      h('div',{title:'範本管理',onClick:function(){if(props.onOpenTemplates)props.onOpenTemplates();},
        style:{width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
          borderRadius:8,fontSize:20,color:'#6b8299',transition:'all 0.12s'},
        onMouseEnter:function(e){e.currentTarget.style.background='rgba(255,255,255,0.08)';},
        onMouseLeave:function(e){e.currentTarget.style.background='transparent';}
      },'📋'),
      isAdmin&&onOpenAuditLog&&h('div',{title:'稽核日誌',onClick:onOpenAuditLog,
        style:{width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
          borderRadius:8,fontSize:18,color:'#6b8299',transition:'all 0.12s'},
        onMouseEnter:function(e){e.currentTarget.style.background='rgba(255,255,255,0.08)';},
        onMouseLeave:function(e){e.currentTarget.style.background='transparent';}
      },h(HistoryOutlined))
    ),
    // Search
    !collapsed&&h('div',{style:{padding:'0 12px 14px'}},
      h('div',{style:{background:'rgba(255,255,255,0.07)',borderRadius:8,padding:'9px 12px',
        display:'flex',alignItems:'center',gap:8,border:'1px solid rgba(255,255,255,0.08)',
        transition:'border-color 0.15s'},
        onFocus:function(e){e.currentTarget.style.borderColor='rgba(22,136,255,0.5)';},
        onBlur:function(e){e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';}},
        h(SearchOutlined,{style:{color:'#6b8299',fontSize:15}}),
        h('input',{value:search,onChange:function(e){onSearch(e.target.value);},placeholder:'搜尋... (⌘K)',
          className:'dochub-search-input',
          style:{background:'transparent',border:'none',outline:'none',color:'#dde6f0',fontSize:15,flex:1,width:'100%'}})
      )
    ),
    // Groups + Projects + Categories
    !collapsed&&h('div',{style:{flex:1,overflow:'auto',minHeight:0,paddingBottom:4}},
      // 全部文件
      h('div',{
        style:{padding:'8px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',
          color:(!activeProjectId&&!activeCatId)?'#fff':'#b0bfcc',fontSize:16,fontWeight:600,
          background:(!activeProjectId&&!activeCatId)?'rgba(22,136,255,0.2)':'transparent',
          borderLeft:(!activeProjectId&&!activeCatId)?'3px solid #1688ff':'3px solid transparent',
          borderRadius:'0 8px 8px 0',marginRight:6,marginBottom:6,transition:'background 0.12s'},
        onMouseEnter:function(e){if(activeProjectId||activeCatId)e.currentTarget.style.background='rgba(255,255,255,0.06)';},
        onMouseLeave:function(e){if(activeProjectId||activeCatId)e.currentTarget.style.background='transparent';},
        onClick:function(){onSelectProject(null);onSelectCat(null);}},
        h('span',null,'📋 全部文件'),
        h('span',{
          title:'全部縮起/展開',
          style:{fontSize:12,color:'#4a6a85',padding:'0 4px',lineHeight:1,cursor:'pointer'},
          onClick:function(e){
            e.stopPropagation();
            var allExp=groups.every(function(g){return groupExpanded[g.id]!==false;});
            var next={};
            groups.forEach(function(g){next[g.id]=!allExp;});
            setGroupExpanded(next);
          }
        },(function(){var allExp=groups.every(function(g){return groupExpanded[g.id]!==false;});return allExp?'⊟':'⊞';})())
      ),
      // 群組標題列已移除
      // 群組列表
      groups.map(function(grp){
        var grpProjects=projects.filter(function(p){return p.groupId===grp.id;});
        var isGrpExp=groupExpanded[grp.id]!==false;
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
              onClick:function(e){e.stopPropagation();setCreateProjGroupId(grp.id);setSelectedProjGroupId(grp.id);setNewProjName('');setNewProjDesc('');setProjFolders(DEFAULT_FOLDERS.map(function(f){return f.name;}));}
            },'+'),
          ),
          isGrpExp&&grpProjects.map(renderProject)
        );
      }),
      // 無群組的專案（過渡期仍顯示，但不提供新增入口）
      ungroupedProjects.length>0&&h('div',null,
        h('div',{style:{padding:'6px 12px'}},
          h('span',{style:{fontSize:12,fontWeight:700,color:'#5a7a99',letterSpacing:'0.8px',textTransform:'uppercase'}},'未分組')
        ),
        ungroupedProjects.map(renderProject)
      ),
      groups.length===0&&ungroupedProjects.length===0&&h('div',{style:{padding:'20px 16px',color:'#4a6a85',fontSize:14,textAlign:'center',lineHeight:1.6}},
        isAdmin
          ? h('div',null,h('div',{style:{fontSize:28,marginBottom:8}},'📁'),h('div',null,'點擊上方 + 建立第一個群組'))
          : '（尚無內容）'
      )
    ),
    // Bottom: 最近查看 + Admin — flexShrink:0 釘在底部，不隨捲動消失
    !collapsed&&h('div',{style:{flexShrink:0}},
      (function(){
        try{
          var recent=JSON.parse(localStorage.getItem('dochub_recent')||'[]');
          if(!recent.length)return null;
          var isRecentCollapsed=props._recentCollapsed;
          var setRecentCollapsed=props._setRecentCollapsed;
          return h('div',{style:{borderTop:'1px solid rgba(255,255,255,0.07)',padding:'6px 12px 4px'}},
            h('div',{
              style:{display:'flex',alignItems:'center',justifyContent:'space-between',
                cursor:'pointer',padding:'4px 0',borderRadius:4,userSelect:'none'},
              onClick:function(){if(setRecentCollapsed)setRecentCollapsed(function(v){return !v;});}},
              h('span',{style:{fontSize:11,fontWeight:700,color:'#5a7a99',letterSpacing:'0.8px',textTransform:'uppercase'}},'最近查看'),
              h('span',{style:{fontSize:11,color:'#3d566e',transition:'transform 0.2s',
                display:'inline-block',transform:isRecentCollapsed?'rotate(0deg)':'rotate(180deg)'}},
                '▲')
            ),
            !isRecentCollapsed&&recent.slice(0,5).map(function(r){
              return h('div',{key:r.id,
                style:{fontSize:14,color:'#8aa8c4',padding:'4px 6px',cursor:'pointer',borderRadius:6,transition:'background 0.1s'},
                title:r.title,
                onMouseEnter:function(e){e.currentTarget.style.background='rgba(255,255,255,0.06)';},
                onMouseLeave:function(e){e.currentTarget.style.background='transparent';},
                onClick:function(){if(props.onNavigate)props.onNavigate('/admin/doc-hub/view/'+r.id+(r.projectId?'?projectId='+r.projectId+(r.categoryId?'&categoryId='+r.categoryId:''):''));}
              },
              h('div',{style:{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},
                h('span',{style:{opacity:0.5,marginRight:5,fontSize:12}},'↩'),r.title
              )
              );
            })
          );
        }catch(e){return null;}
      })(),
      h('div',{style:{borderTop:'1px solid rgba(255,255,255,0.07)',padding:'8px 12px'}},
        isAdmin&&onOpenAuditLog&&h('div',{
          style:{color:'#7a9ab8',fontSize:15,cursor:'pointer',padding:'6px 8px',display:'flex',alignItems:'center',gap:8,
            borderRadius:6,transition:'background 0.1s'},
          onMouseEnter:function(e){e.currentTarget.style.background='rgba(255,255,255,0.06)';},
          onMouseLeave:function(e){e.currentTarget.style.background='transparent';},
          onClick:onOpenAuditLog},
          h(HistoryOutlined,{style:{fontSize:15}}),
          '稽核日誌'
        ),
        isAdmin&&h('div',{
          style:{color:'#7a9ab8',fontSize:15,cursor:'pointer',padding:'6px 8px',display:'flex',alignItems:'center',gap:8,
            borderRadius:6,transition:'background 0.1s'},
          onMouseEnter:function(e){e.currentTarget.style.background='rgba(255,255,255,0.06)';},
          onMouseLeave:function(e){e.currentTarget.style.background='transparent';},
          onClick:function(){if(props.onOpenTemplates)props.onOpenTemplates();}},
          h('span',{style:{fontSize:15}},'📋'),
          '範本管理'
        )
      )
    ),

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
      onCancel:function(){setCreateProjGroupId(null);setSelectedProjGroupId(null);setNewProjName('');setNewProjDesc('');setProjFolders(DEFAULT_FOLDERS.map(function(f){return f.name;}));},
      width:520,
      footer:h(Space,null,
        h(Button,{onClick:function(){setCreateProjGroupId(null);setSelectedProjGroupId(null);setNewProjName('');setNewProjDesc('');setProjFolders(DEFAULT_FOLDERS.map(function(f){return f.name;}));}},'取消'),
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
      // 初始資料夾清單
      h('div',null,
        h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}},
          h('div',{style:{fontSize:13,fontWeight:600,color:'#1e293b'}},'初始資料夾'),
          h('div',{style:{fontSize:12,color:'#94a3b8'}},'建立專案後自動產生以下資料夾')
        ),
        h('div',{style:{
          background:'#f8fafc',borderRadius:8,border:'1px solid #e2e8f0',
          padding:'8px',display:'flex',flexDirection:'column',gap:4,maxHeight:220,overflowY:'auto'}},
          projFolders.map(function(name,idx){
            return h('div',{key:idx,style:{display:'flex',alignItems:'center',gap:6}},
              h('span',{style:{color:'#94a3b8',fontSize:12,width:18,textAlign:'right',flexShrink:0}},idx+1+'.'),
              h(Input,{
                value:name,
                size:'small',
                placeholder:'資料夾名稱',
                style:{flex:1,fontSize:13},
                onChange:function(e){
                  var v=e.target.value;
                  setProjFolders(function(prev){var n=prev.slice();n[idx]=v;return n;});
                }
              }),
              h(Button,{
                size:'small',type:'text',danger:true,
                icon:h(DeleteOutlined),
                style:{flexShrink:0,padding:'0 4px'},
                onClick:function(){setProjFolders(function(prev){return prev.filter(function(_,i){return i!==idx;});});}
              })
            );
          }),
          h(Button,{
            size:'small',type:'dashed',icon:h(PlusOutlined),
            style:{marginTop:4,width:'100%',borderColor:'#e2e8f0',color:'#64748b'},
            onClick:function(){setProjFolders(function(prev){return prev.concat(['']);});}
          },'新增資料夾')
        ),
        projFolders.filter(function(n){return n&&n.trim();}).length===0&&
          h('div',{style:{marginTop:6,fontSize:12,color:'#f59e0b'}},'⚠ 不建立任何資料夾，建立後需手動新增')
      )
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
              message:'專案層級權限',
              description:'設定後，有權限的用戶可查看此專案下的所有文件，不需要逐一設定文件或資料夾權限。'
            }),
            h('div',{style:{marginBottom:16}},
              h('div',{style:{fontWeight:600,marginBottom:8,color:'#333'}},'📖 可查看（Viewer）'),
              h('div',{style:{fontSize:12,color:'#888',marginBottom:8}},'可查看此專案下的所有文件'),
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
              h('div',{style:{fontWeight:600,marginBottom:8,color:'#333'}},'✏️ 可編輯（Editor）'),
              h('div',{style:{fontSize:12,color:'#888',marginBottom:8}},'可查看及編輯此專案下的所有文件'),
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
            ),
            h('div',null,
              h('div',{style:{fontWeight:600,marginBottom:8,color:'#333'}},'📬 訂閱通知（Subscriber）'),
              h('div',{style:{fontSize:12,color:'#888',marginBottom:8}},'此專案下任何文件有更新時，這些用戶會收到站內信通知'),
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
  // props: open, onCancel, onFreeWrite, onTemplate, onGitSync, hasCat
  var open = props.open; var onCancel = props.onCancel;
  var onFreeWrite = props.onFreeWrite; var onTemplate = props.onTemplate;
  var onGitSync = props.onGitSync; var hasCat = !!props.hasCat;
  function cardStyle(disabled) {
    return {border:'1px solid '+(disabled?'#f0f0f0':'#d9d9d9'),borderRadius:8,padding:'20px 12px',textAlign:'center',
      cursor:disabled?'not-allowed':'pointer',transition:'all 0.2s',
      background:disabled?'#fafafa':'#fafafa',opacity:disabled?0.5:1};
  }
  function makeCard(emoji, title, desc, onClick, disabled) {
    return h(Tooltip,{title:disabled?'請先在左側選擇資料夾':null},
      h('div',{
        onClick:disabled?null:onClick,
        style:cardStyle(disabled),
        onMouseEnter:function(e){if(!disabled){e.currentTarget.style.borderColor='#1677ff';e.currentTarget.style.background='#e6f4ff';}},
        onMouseLeave:function(e){if(!disabled){e.currentTarget.style.borderColor='#d9d9d9';e.currentTarget.style.background='#fafafa';}}
      },
        h('div',{style:{fontSize:28,marginBottom:8}},emoji),
        h('div',{style:{fontSize:13,fontWeight:600,color:disabled?'#bbb':'#1a1f26',marginBottom:4}},title),
        h('div',{style:{fontSize:11,color:'#8c8c8c',lineHeight:1.4}},desc)
      )
    );
  }
  return h(Modal,{title:'新增文件',open:open,onCancel:onCancel,footer:null,width:480},
    h('div',{style:{display:'flex',flexDirection:'column',gap:16,padding:'8px 0'}},
      !hasCat&&h('div',{style:{background:'#fffbe6',border:'1px solid #ffe58f',borderRadius:6,padding:'8px 12px',fontSize:13,color:'#ad6800'}},
        '⚠️ 請先在左側選擇資料夾，才能新增文件'
      ),
      h('p',{style:{color:'#595959',margin:0,fontSize:14}},'請選擇新增方式：'),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}},
        makeCard('✍️','自由撰寫','Markdown 格式自由撰寫',onFreeWrite,!hasCat),
        makeCard('📋','使用範本','使用預設表單範本填寫',onTemplate,!hasCat),
        makeCard('🔄','Git 同步','從 GitHub 倉庫拉取文件',onGitSync,!hasCat)
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

// ── ListPage ─────────────────────────────────────────────────────────────────
function ListPage(){
  var loc=useLocation();
  var _initCtx=(function(){
    var qp=new URLSearchParams(loc.search||'');
    return {projectId:qp.get('projectId')?Number(qp.get('projectId')):null,categoryId:qp.get('categoryId')?Number(qp.get('categoryId')):null,search:qp.get('q')||''};
  })();
  var _s=useState(_initCtx.search||'');var search=_s[0];var setSearch=_s[1];
  var _sf=useState('all');var sf=_sf[0];var setSf=_sf[1];
  var _cat=useState(_initCtx.categoryId);var activeCatId=_cat[0];var setActiveCatId=_cat[1];
  var _proj=useState(_initCtx.projectId);var activeProjectId=_proj[0];var setActiveProjectId=_proj[1];
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
  // Audit Log modal
  var _al=useState(false);var showAuditLog=_al[0];var setShowAuditLog=_al[1];
  var _alData=useState([]);var auditData=_alData[0];var setAuditData=_alData[1];
  var _alLoad=useState(false);var auditLoading=_alLoad[0];var setAuditLoading=_alLoad[1];
  var _tt=useState('all');var typeTab=_tt[0];var setTypeTab=_tt[1];
  var _dq=useState('');var debouncedSearch=_dq[0];var setDebouncedSearch=_dq[1];
  useEffect(function(){
    var t=setTimeout(function(){setDebouncedSearch(search);},400);
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
  useEffect(function(){setSf('all');setTypeTab('all');},[activeProjectId,activeCatId]);
  var _dl=useDocList(debouncedSearch,activeCatId,null,sf,activeProjectId);
  var docs=_dl.data;var loading=_dl.loading;var reload=_dl.reload;
  var client=useAPIClient();
  var navigate=useNavigate();
  var currentUser=useCurrentUser();
  var isAdminUser=!!(currentUser&&(Number(currentUser.id)===1||(currentUser.roles&&currentUser.roles.some(function(r){return r.name==='root'||r.name==='admin';}))));
  var docTypes=useOptions('docTypes');
  var allProjectsList=useOptions('docProjects');
  var allCatsList=useOptions('docCategories');
  var filtered=typeTab==='all'?docs:docs.filter(function(d){return d.type&&String(d.type.id)===typeTab;});

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
  var _cw=useState({title:300,category:120,type:100,status:90,upd:190,gs:100,actions:155});
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
              highlightText(s.text,keyword)
            );
          })
        )
      );
    }},
    {title:'資料夾',dataIndex:'category',key:'category',width:colWidths.category,onHeaderCell:function(col){return{width:col.width,onResize:function(w){setColWidth('category',w);}};},sorter:function(a,b){return ((a.category&&a.category.name)||'').localeCompare((b.category&&b.category.name)||'','zh-TW');},render:function(cat){return cat?h(Tag,{color:'geekblue',style:{fontSize:14}},cat.name||'-'):h('span',{style:{color:'#bbb',fontSize:14}},'（無）');}},
    {title:'文件類型',dataIndex:'type',key:'type',width:colWidths.type,onHeaderCell:function(col){return{width:col.width,onResize:function(w){setColWidth('type',w);}};},sorter:function(a,b){return ((a.type&&a.type.name)||'').localeCompare((b.type&&b.type.name)||'','zh-TW');},render:function(t){return t?h(Tag,{color:'blue',style:{fontSize:14}},t.name||t):'-';}},
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

  // Type tabs
  var hasAnyGitRepo=docs.some(function(d){return !!d.githubRepo;});
  var tabs=[{key:'all',label:'全部'}].concat(docTypes.map(function(t){
    var cnt=docs.filter(function(d){return d.type&&String(d.type.id)===String(t.id);}).length;
    if(activeCatId&&cnt===0)return null;
    return{key:String(t.id),label:t.name};
  }).filter(Boolean));

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
        h('div',{style:{fontSize:15,color:'#73808c',marginBottom:4}},
          (function(){
            var parts=['全部文件'];
            if(activeProjectId){var p=allProjectsList.find(function(x){return x.id===activeProjectId;});if(p)parts.push(p.name);}
            if(activeCatId){var c=allCatsList.find(function(x){return x.id===activeCatId;});if(c)parts.push(c.name);}
            return parts.join(' › ');
          })()
        ),
        h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:activeProjectId?12:16}},
          h('div',{style:{fontSize:28,fontWeight:700,color:'#1a1f26'}},(function(){
            if(activeCatId){var c=allCatsList.find(function(x){return x.id===activeCatId;});if(c)return c.name;}
            if(activeProjectId){var p=allProjectsList.find(function(x){return x.id===activeProjectId;});if(p)return p.name;}
            return '全部文件';
          })()),
          h('div',{style:{display:'flex',alignItems:'center',gap:8}},
            isAdminUser&&(activeCatId
              ? h(Button,{type:'primary',icon:h(PlusOutlined),onClick:function(){setShowNewDocModal(true);}},'新增文件')
              : activeProjectId
                ? h(Tooltip,{title:'請先在左側選擇資料夾'},h(Button,{type:'primary',icon:h(PlusOutlined),disabled:true},'新增文件'))
                : null
            ),
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
        // Type tabs
        h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'2px solid #ebedf0',marginBottom:0}},
          h('div',{style:{display:'flex',gap:24}},
            tabs.map(function(tab){
              var isActive=typeTab===tab.key;
              var count=tab.key==='all'?docs.length:docs.filter(function(d){return d.type&&String(d.type.id)===tab.key;}).length;
              return h('div',{key:tab.key,
                style:{padding:'10px 0',fontSize:16,fontWeight:isActive?600:400,color:isActive?'#1677ff':'#73808c',
                  borderBottom:isActive?'2px solid #1677ff':'2px solid transparent',marginBottom:-2,cursor:'pointer'},
                onClick:function(){setTypeTab(tab.key);}},
                h('span',{style:{display:'inline-flex',alignItems:'center',gap:6}},
                  tab.label,
                  h('span',{style:{fontSize:13,padding:'1px 7px',borderRadius:10,
                    background:isActive?'#e6f4ff':'#f0f0f0',
                    color:isActive?'#1677ff':'#8c8c8c',fontWeight:600}},
                    count
                  )
                )
              );
            })
          ),
          h(Select,{
            value:sf,size:'small',bordered:false,
            style:{minWidth:90,fontSize:13,marginBottom:2},
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
      width:900,
      footer:h(Button,{onClick:function(){setShowAuditLog(false);}},'關閉')},
      auditLoading
        ? h('div',{style:{textAlign:'center',padding:40}},h(Spin,null))
        : h(Table,{
            dataSource:auditData,
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
        : h('div',{style:{display:'flex',flexDirection:'column',gap:20}},
            h('div',null,
              h('div',{style:{fontWeight:600,marginBottom:6}},'👁 閱覽者'),
              h(Select,{mode:'multiple',style:{width:'100%'},value:infoPermViewerIds,onChange:setInfoPermViewerIds,
                placeholder:'選擇可閱覽的使用者',
                options:infoPermAllUsers.map(function(u){return{label:(u.nickname||u.username||'#'+u.id),value:u.id};})})
            ),
            h('div',null,
              h('div',{style:{fontWeight:600,marginBottom:6}},'✏️ 編輯者'),
              h(Select,{mode:'multiple',style:{width:'100%'},value:infoPermEditorIds,onChange:setInfoPermEditorIds,
                placeholder:'選擇可編輯的使用者',
                options:infoPermAllUsers.map(function(u){return{label:(u.nickname||u.username||'#'+u.id),value:u.id};})})
            ),
            h('div',null,
              h('div',{style:{fontWeight:600,marginBottom:6}},'🔔 訂閱者'),
              h(Select,{mode:'multiple',style:{width:'100%'},value:infoPermSubscriberIds,onChange:setInfoPermSubscriberIds,
                placeholder:'選擇接收通知的使用者',
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
    client.request({url:resource+':list',method:'get',params:{pageSize:100}})
      .then(function(res){setData((res.data&&res.data.data)||[]);})
      .catch(function(){});
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
    return {projectId:qs.get('projectId')?parseInt(qs.get('projectId')):null,categoryId:qs.get('categoryId')?parseInt(qs.get('categoryId')):null};
  })();
  var _f=useState({title:'',content:'',status:'draft',typeId:null,projectId:_initIds.projectId,categoryId:_initIds.categoryId,githubRepo:'',githubFilePath:'',githubBranch:''});var form=_f[0];var setForm=_f[1];
  var _sv=useState(false);var saving=_sv[0];var setSaving=_sv[1];
  var _syn=useState(false);var syncing=_syn[0];var setSyncing=_syn[1];
  var _sm=useState(false);var showSync=_sm[0];var setShowSync=_sm[1];
  var _sc=useState(false);var showSaveModal=_sc[0];var setShowSaveModal=_sc[1];
  var _cs=useState('');var changeSummary=_cs[0];var setChangeSummary=_cs[1];
  var _br=useState(false);var btnReady=_br[0];var setBtnReady=_br[1];
  var _mr=useState(!!window.marked);var markedReady=_mr[0];var setMarkedReady=_mr[1];
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
  var docTypes=useOptions('docTypes');
  var allUsers=useOptions('users');
  var allProjects=useOptions('docProjects');
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

  // 自動比對資料夾名稱→文件類型（新增模式：projCats 或 docTypes 任一載入完就跑）
  useEffect(function(){
    if(!isNew||!form.categoryId||form.typeId||!projCats.length||!docTypes.length)return;
    var cat=projCats.find(function(c){return String(c.id)===String(form.categoryId);});
    if(!cat)return;
    var catName=(cat.name||'').trim().toLowerCase();
    var matched=docTypes.find(function(t){return (t.name||'').trim().toLowerCase()===catName;});
    if(matched)setForm(function(f){return Object.assign({},f,{typeId:matched.id});});
  },[projCats,docTypes]);

  useEffect(function(){
    if(!docData)return;
    setForm({title:docData.title||'',content:docData.content||'',status:docData.status||'draft',typeId:docData.typeId||null,
      projectId:docData.projectId||null,categoryId:docData.categoryId||null,
      githubRepo:docData.githubRepo||'',githubFilePath:docData.githubFilePath||'',githubBranch:docData.githubBranch||''});
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
    if(!form.typeId){message.warning('請選擇文件類型');return false;}
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

  // 處理 textarea paste 貼圖
  function handleEditorPaste(e){
    var items=e.clipboardData&&e.clipboardData.items;
    if(!items)return;
    for(var i=0;i<items.length;i++){
      if(items[i].type.startsWith('image/')){
        e.preventDefault();
        uploadImageFile(items[i].getAsFile());
        return;
      }
    }
  }

  // 處理 textarea drop 拖圖
  function handleEditorDrop(e){
    var files=e.dataTransfer&&e.dataTransfer.files;
    if(!files||!files.length)return;
    var f=files[0];
    if(f.type.startsWith('image/')){
      e.preventDefault();
      uploadImageFile(f);
    }
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
            onChange:function(v){
              setField('categoryId',v);
              // 自動比對資料夾名稱 → 帶入文件類型（新增或既有文件切換資料夾都觸發）
              if(v){
                var cat=projCats.find(function(c){return String(c.id)===String(v);});
                if(cat){
                  var catName=(cat.name||'').trim().toLowerCase();
                  var matched=docTypes.find(function(t){return (t.name||'').trim().toLowerCase()===catName;});
                  if(matched)setField('typeId',matched.id);
                }
              }
            },
            options:projCats.map(function(c){return{label:c.name,value:c.id};})}),!form.projectId&&h('span',{style:{fontSize:11,color:'#ff4d4f',marginLeft:4}},'請先選擇專案'))},
          {label:'類型',required:!form.typeId,content:h(Select,{
            value:form.typeId,size:'small',bordered:false,allowClear:true,
            placeholder:'文件類型',
            style:{minWidth:120,color:!form.typeId?'#ef4444':'#334155'},
            onChange:function(v){
              setField('typeId',v);
              if(isNew){var t=docTypes.find(function(x){return x.id===v;});if(t&&t.template&&!form.content)setField('content',t.template);}
            },
            options:docTypes.map(function(t){return{label:t.name,value:t.id};})})},
          {label:'狀態',content:h(Select,{
            value:form.status,size:'small',bordered:false,
            style:{minWidth:100,color:'#334155'},
            onChange:function(v){setField('status',v);},
            options:[{label:'Draft',value:'draft'},{label:'Published',value:'published'}]})}
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
    // 已設定 repo → 任何人（含管理員）都只能唯讀；尚未設定且是管理員 → 可填入；非管理員且無 repo → 不顯示
    form.githubRepo
      ? h('div',{style:{
          background:'#f0fdfa',borderBottom:'1px solid #ccfbf1',
          padding:'0 16px',height:36,
          display:'flex',alignItems:'center',gap:10,flexShrink:0,overflow:'auto'}},
          h('span',{style:{fontSize:10,fontWeight:700,color:'#0d9488',letterSpacing:'0.06em',textTransform:'uppercase',flexShrink:0}},'Git'),
          h('span',{style:{fontSize:11,color:'#0d9488',flexShrink:0}},'🔗'),
          h('span',{style:{fontSize:12,color:'#0f766e',fontFamily:'monospace',fontWeight:500}},
            form.githubRepo+(form.githubFilePath?' / '+form.githubFilePath:'')+(form.githubBranch?' @ '+form.githubBranch:'')),
          h(Button,{size:'small',icon:h(SyncOutlined),onClick:doPullFromGit,loading:pulling,
            style:{background:'#fff',border:'1px solid #ccfbf1',color:'#0d9488',fontSize:11,flexShrink:0,marginLeft:4}},
            isNew?'從 Git 拉取':'拉取最新')
        )
      : isAdminEdit&&h('div',{style:{
          background:'#f8fafc',borderBottom:'1px solid #e2e8f0',
          padding:'0 16px',height:36,
          display:'flex',alignItems:'center',gap:12,flexShrink:0,overflow:'auto'}},
          h('span',{style:{fontSize:10,fontWeight:700,color:'#94a3b8',letterSpacing:'0.06em',textTransform:'uppercase',flexShrink:0}},'Git（選填）'),
          h(Input,{value:form.githubRepo,onChange:function(e){setField('githubRepo',e.target.value);},
            placeholder:'owner/repo 或 host/ns/project',size:'small',
            style:{width:240,fontSize:11,background:'#fff',border:'1px solid #e2e8f0',color:'#334155',borderRadius:4},
            prefix:h('span',{style:{color:'#94a3b8',fontSize:10,marginRight:2}},'Repo')}),
          h(Input,{value:form.githubFilePath,onChange:function(e){setField('githubFilePath',e.target.value);},
            placeholder:'docs/file.md',size:'small',
            style:{width:180,fontSize:11,background:'#fff',border:'1px solid #e2e8f0',color:'#334155',borderRadius:4},
            prefix:h('span',{style:{color:'#94a3b8',fontSize:10,marginRight:2}},'Path')}),
          h(Input,{value:form.githubBranch,onChange:function(e){setField('githubBranch',e.target.value);},
            placeholder:'main',size:'small',
            style:{width:130,fontSize:11,background:'#fff',border:'1px solid #e2e8f0',color:'#334155',borderRadius:4},
            prefix:h('span',{style:{color:'#94a3b8',fontSize:10,marginRight:2}},'Branch')})
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
              // diff body
              h('div',{style:{background:'#1e1e1e',borderRadius:8,overflow:'auto',fontFamily:'monospace',fontSize:12,lineHeight:1.6}},
                diffLines.length===0
                  ?h('div',{style:{padding:24,color:'#888',textAlign:'center'}},'（無變更）')
                  :diffLines.map(function(line,i){
                      var bg=line.type==='add'?'rgba(76,175,80,0.15)':line.type==='remove'?'rgba(244,67,54,0.15)':'transparent';
                      var color=line.type==='add'?'#81c784':line.type==='remove'?'#e57373':'#ccc';
                      var prefix=line.type==='add'?'+ ':line.type==='remove'?'- ':'  ';
                      return h('div',{key:i,style:{padding:'1px 16px',background:bg,whiteSpace:'pre-wrap',wordBreak:'break-all'}},
                        h('span',{style:{color:color,userSelect:'none',marginRight:4}},prefix),
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

  // 權限判斷
  var isAdmin=currentUser.id===1||!!(currentUser.roles&&currentUser.roles.some(function(r){return r.name==='root'||r.name==='admin';}));
  var viewers=doc&&doc.viewers||[];
  var editors=doc&&doc.editors||[];
  var canView=isAdmin||!!(doc&&doc.authorId===currentUser.id)||viewers.some(function(v){return v.id===currentUser.id;});
  var canEdit=isAdmin||!!(doc&&doc.authorId===currentUser.id)||editors.some(function(v){return v.id===currentUser.id;});
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
          doc.type&&h('span',{style:{
            display:'inline-flex',alignItems:'center',
            padding:'3px 10px',borderRadius:10,fontSize:12,fontWeight:500,
            background:'#f0fdfa',color:'#0d9488',border:'1px solid #99f6e4'}},
            doc.type.name),
          updatedStr&&h('span',{style:{display:'inline-flex',alignItems:'center',gap:5,fontSize:13,color:'#64748b'}},
            h('span',{style:{opacity:0.5,fontSize:12}},'🕐'),updatedStr),
          editorName&&h('span',{style:{display:'inline-flex',alignItems:'center',gap:5,fontSize:13,color:'#64748b'}},
            h(UserOutlined,{style:{fontSize:12,opacity:0.5}}),editorName)
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
      console.log('[DocHub] routes registered');
    });
  };
  return DocHubPlugin;
}(Plugin);

}(),exports$}()});
