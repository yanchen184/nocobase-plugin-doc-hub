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
var useParams=_rr.useParams;
var useNavigate=_rr.useNavigate;
var useLocation=_rr.useLocation||function(){return {search:window.location.search};};

var Table=_antd.Table,Button=_antd.Button,Input=_antd.Input,Select=_antd.Select,Modal=_antd.Modal,Tag=_antd.Tag,Space=_antd.Space,Spin=_antd.Spin,message=_antd.message,Typography=_antd.Typography,Tooltip=_antd.Tooltip,Badge=_antd.Badge,Row=_antd.Row,Col=_antd.Col,Alert=_antd.Alert,Empty=_antd.Empty,Divider=_antd.Divider,Avatar=_antd.Avatar,Popover=_antd.Popover;
var PlusOutlined=_icons.PlusOutlined,SearchOutlined=_icons.SearchOutlined,HistoryOutlined=_icons.HistoryOutlined,EditOutlined=_icons.EditOutlined,SyncOutlined=_icons.SyncOutlined,ExclamationCircleOutlined=_icons.ExclamationCircleOutlined,FolderOutlined=_icons.FolderOutlined,FileTextOutlined=_icons.FileTextOutlined,ArrowLeftOutlined=_icons.ArrowLeftOutlined,UserOutlined=_icons.UserOutlined,BoldOutlined=_icons.BoldOutlined,ItalicOutlined=_icons.ItalicOutlined,UnderlineOutlined=_icons.UnderlineOutlined,LinkOutlined=_icons.LinkOutlined,CodeOutlined=_icons.CodeOutlined,OrderedListOutlined=_icons.OrderedListOutlined,UnorderedListOutlined=_icons.UnorderedListOutlined,DeleteOutlined=_icons.DeleteOutlined,SwapOutlined=_icons.SwapOutlined,InfoCircleOutlined=_icons.InfoCircleOutlined;

// 動態載入 marked.js（CDN），載入後 window.marked 可用
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
function loadMarked(cb){
  if(getMarkedParse()){cb();return;}
  _markedCallbacks.push(cb);
  if(_markedLoaded)return;
  _markedLoaded=true;
  var s=document.createElement('script');
  s.src='/static/plugins/@nocobase/plugin-doc-hub/dist/client/marked.min.js';
  s.onload=function(){
    try{
      var m=window.marked;
      if(m&&m.setOptions)m.setOptions({breaks:true,gfm:true});
      else if(m&&m.use)m.use({breaks:true,gfm:true});
    }catch(e){}
    _markedCallbacks.forEach(function(fn){fn();});
    _markedCallbacks=[];
  };
  document.head.appendChild(s);
}
function renderMarkdown(md){
  if(!md)return'';
  var parse=getMarkedParse();
  if(parse)return parse(md);
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
  var client=useAPIClient();
  var navigate=useNavigate();
  var currentUser=useCurrentUser();
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
  var _cpn=useState('');var newProjName=_cpn[0];var setNewProjName=_cpn[1];
  var _cps=useState(false);var creatingProj=_cps[0];var setCreatingProj=_cps[1];

  // Create Category modal
  var _cc=useState(null);var createCatProjId=_cc[0];var setCreateCatProjId=_cc[1]; // null = hidden
  var _ccp=useState(null);var createCatParentId=_ccp[0];var setCreateCatParentId=_ccp[1]; // null = 根節點
  var _ccn=useState('');var newCatName=_ccn[0];var setNewCatName=_ccn[1];
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
          client.request({url:'docDocuments:list',method:'get',params:{pageSize:1,filter:{projectId:p.id}}})
            .then(function(r){
              var m=r.data&&r.data.meta;var cnt=m?(m.count||m.total||0):0;
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
    setCreatingProj(true);
    client.request({url:'docProjects:create',method:'post',data:{name:newProjName.trim(),groupId:createProjGroupId>0?createProjGroupId:null}})
      .then(function(){message.success('專案建立成功');setCreateProjGroupId(null);setNewProjName('');setCreatingProj(false);loadSidebar();})
      .catch(function(err){message.error('失敗: '+(err&&err.message||'error'));setCreatingProj(false);});
  }

  function doCreateCategory(){
    if(!newCatName.trim()||!client)return;
    setCreatingCat(true);
    var payload={name:newCatName.trim(),projectId:createCatProjId};
    if(createCatParentId)payload.parentId=createCatParentId;
    client.request({url:'docCategories:create',method:'post',data:payload})
      .then(function(){
        message.success('資料夾建立成功');
        setCreateCatProjId(null);setCreateCatParentId(null);setNewCatName('');setCreatingCat(false);
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

  var sidebarStyle={
    width:240,flexShrink:0,background:'#1e2d3d',minHeight:'100vh',
    display:'flex',flexDirection:'column',position:'sticky',top:0,height:'100vh',overflow:'auto'
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
        onMouseEnter:function(){if(_dragRef.current.active)_dragRef.current.overCatId=cat.id;},
        onMouseLeave:function(){if(_dragRef.current.active&&_dragRef.current.overCatId===cat.id)_dragRef.current.overCatId=null;}
      },
        h('div',{
          style:{padding:'6px 16px 6px '+indent+'px',display:'flex',alignItems:'center',justifyContent:'space-between',
            cursor:isRenaming?'text':(isDraggingThis?'grabbing':'grab'),
            color:isActive?'#fff':'#a6b2c2',fontSize:14,
            background:isDraggingThis?'rgba(22,136,255,0.08)':isDragOver?'rgba(22,136,255,0.12)':(isActive?'rgba(22,136,255,0.15)':'transparent'),
            borderLeft:isActive?'3px solid #1688ff':'3px solid transparent',
            opacity:isDraggingThis?0.5:1},
          onMouseDown:handleCatMouseDown,
          onClick:function(){if(isRenaming||_dragRef.current.active)return;onSelectProject(projId);onSelectCat(isActive?null:cat.id);}},
          h('span',{style:{flex:1,overflow:'hidden',display:'flex',alignItems:'center',minWidth:0}},
            hasChildren
              ?h('span',{onClick:function(e){e.stopPropagation();toggleExpand(cat.id);},style:{marginRight:2,opacity:0.7,flexShrink:0}},(isExp?'▾':'▸'))
              :h('span',{style:{marginRight:2,opacity:0,flexShrink:0}},'▸'),
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
                    fontSize:14,outline:'none',width:'100%',padding:'0 2px'}
                })
              :h('span',{
                  style:{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},
                  onDoubleClick:function(e){e.stopPropagation();setRenamingCatId(cat.id);setRenameCatName(cat.name);}
                },cat.name)
          ),
          h('span',{style:{display:'flex',alignItems:'center',gap:2,flexShrink:0}},
            h('span',{title:'新增子資料夾',onClick:function(e){e.stopPropagation();setCreateCatProjId(projId);setCreateCatParentId(cat.id);setNewCatName('');},style:{color:'#6b8299',fontSize:14,cursor:'pointer',padding:'0 2px',lineHeight:1}},'+'),
            isAdmin&&h('span',{title:'刪除資料夾',onClick:function(e){e.stopPropagation();setDeleteCat(cat);},style:{color:'#8c4444',fontSize:11,cursor:'pointer',padding:'0 2px',lineHeight:1,opacity:0.6}},'×')
          )
        ),
        isExp&&renderCatTree(cat.id, projId, depth+1)
      );
    });
  }

  function renderProject(proj){
    var isProjActive=activeProjectId===proj.id;
    var isProjExp=expandedProj[proj.id]!==false; // 預設展開
    return h('div',{key:proj.id},
      h('div',{
        style:{padding:'8px 16px 8px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',
          color:isProjActive?'#fff':'#d9e0eb',fontSize:15,fontWeight:600,
          background:isProjActive?'rgba(22,136,255,0.2)':'transparent',
          borderLeft:isProjActive?'3px solid #1688ff':'3px solid transparent',
          transition:'background 0.15s'}},
        // 展開/收合箭頭
        h('span',{
          onClick:function(e){e.stopPropagation();setExpandedProj(function(prev){var n=Object.assign({},prev);n[proj.id]=!isProjExp;return n;});},
          style:{color:'#6b8299',fontSize:10,cursor:'pointer',padding:'0 4px 0 0',userSelect:'none',flexShrink:0,lineHeight:1}
        },isProjExp?'▾':'▸'),
        h('span',{
          style:{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},
          onClick:function(){onSelectProject(isProjActive?null:proj.id);onSelectCat(null);}
        },'📁 ',proj.name),
        h('div',{style:{display:'flex',alignItems:'center',gap:4,flexShrink:0}},
          h('span',{style:{background:isProjActive?'#1688ff':'#2a4060',borderRadius:9,padding:'1px 7px',fontSize:12,color:'#fff',fontWeight:600}},
            docCount[proj.id]!=null?docCount[proj.id]:'…'),
          h('span',{
            title:'新增根資料夾',
            onClick:function(e){e.stopPropagation();setCreateCatProjId(proj.id);setCreateCatParentId(null);setNewCatName('');},
            style:{color:'#6b8299',fontSize:13,cursor:'pointer',padding:'0 2px',lineHeight:1}},'+'),
          isAdmin&&h('span',{
            title:'刪除專案',
            onClick:function(e){e.stopPropagation();setDeleteProj(proj);},
            style:{color:'#8c4444',fontSize:12,cursor:'pointer',padding:'0 2px',lineHeight:1,opacity:0.6}},'×')
        )
      ),
      // 資料夾樹，可收合
      isProjExp&&renderCatTree(null, proj.id, 0)
    );
  }

  return h('div',{style:sidebarStyle},
    // Logo
    h('div',{style:{padding:'24px 16px 12px'}},
      h('div',{style:{fontSize:22,fontWeight:700,color:'#fff',cursor:'pointer'},onClick:function(){navigate('/admin/doc-hub');}},'DocHub')
    ),
    // Search
    h('div',{style:{padding:'0 16px 16px'}},
      h('div',{style:{background:'#26384d',borderRadius:6,padding:'8px 12px',display:'flex',alignItems:'center',gap:6}},
        h(SearchOutlined,{style:{color:'#99a6b2',fontSize:13}}),
        h('input',{value:search,onChange:function(e){onSearch(e.target.value);},placeholder:'全文搜尋文件...',
          style:{background:'transparent',border:'none',outline:'none',color:'#e0e8f0',fontSize:14,flex:1,width:'100%'}})
      )
    ),
    // Groups + Projects + Categories
    h('div',{style:{flex:1,overflow:'auto'}},
      // 全部文件（清除篩選）
      h('div',{
        style:{padding:'8px 16px',display:'flex',alignItems:'center',gap:8,cursor:'pointer',
          color:(!activeProjectId&&!activeCatId)?'#fff':'#a6b2c2',fontSize:15,fontWeight:600,
          background:(!activeProjectId&&!activeCatId)?'rgba(22,136,255,0.15)':'transparent',
          borderLeft:(!activeProjectId&&!activeCatId)?'3px solid #1688ff':'3px solid transparent',
          marginBottom:4},
        onClick:function(){onSelectProject(null);onSelectCat(null);}},
        h('span',null,'📋 全部文件')
      ),
      // 群組標題 + 全部縮起 + 新增群組按鈕（admin only）
      h('div',{style:{padding:'0 16px 6px',display:'flex',alignItems:'center',justifyContent:'space-between'}},
        h('span',{style:{fontSize:13,fontWeight:700,color:'#8c99ad',letterSpacing:'0.5px'}},'群組'),
        h('span',{style:{display:'flex',alignItems:'center',gap:6}},
          h('span',{
            title:'全部資料夾縮起',
            onClick:function(){
              // 把所有 cat 的 expanded 設成 false
              var collapsed={};
              cats.forEach(function(c){collapsed[c.id]=false;});
              setExpanded(collapsed);
              var collapsedProj={};
              projects.forEach(function(p){collapsedProj[p.id]=false;});
              setExpandedProj(collapsedProj);
            },
            style:{color:'#6b8299',fontSize:11,cursor:'pointer',padding:'1px 4px',lineHeight:1,
              border:'1px solid #33475c',borderRadius:3,userSelect:'none',letterSpacing:'0.3px'}
          },'━━'),
          isAdmin&&h('span',{
            title:'新增群組',
            onClick:function(){setShowCreateGroup(true);setNewGroupName('');},
            style:{color:'#6b8299',fontSize:16,cursor:'pointer',lineHeight:1,padding:'0 2px'}},'+')
        )
      ),
      // 群組列表
      groups.map(function(grp){
        var grpProjects=projects.filter(function(p){return p.groupId===grp.id;});
        var isGrpExp=groupExpanded[grp.id]!==false; // default open
        return h('div',{key:grp.id},
          // Group row
          h('div',{
            style:{padding:'8px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',
              color:'#c0ccd8',fontSize:12,fontWeight:700,letterSpacing:'0.3px'},
            onClick:function(){setGroupExpanded(function(e){var n=Object.assign({},e);n[grp.id]=!isGrpExp;return n;});}},
            h('span',null,(isGrpExp?'▾ ':'▸ '),'🗂 ',grp.name),
            isAdmin&&h('span',{
              title:'在此群組新增專案',
              onClick:function(e){e.stopPropagation();setCreateProjGroupId(grp.id);setNewProjName('');},
              style:{color:'#6b8299',fontSize:14,cursor:'pointer',padding:'0 2px',lineHeight:1}},'+')
          ),
          // Projects in this group
          isGrpExp&&grpProjects.map(renderProject)
        );
      }),
      // 無群組的專案（ungrouped）
      ungroupedProjects.length>0&&h('div',null,
        h('div',{style:{padding:'8px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}},
          h('span',{style:{fontSize:13,fontWeight:700,color:'#8c99ad',letterSpacing:'0.5px'}},'未分組專案'),
          isAdmin&&h('span',{
            title:'新增專案（無群組）',
            onClick:function(){setCreateProjGroupId(-1);setNewProjName('');}, // -1 = no group
            style:{color:'#6b8299',fontSize:14,cursor:'pointer',padding:'0 2px',lineHeight:1}},'+')
        ),
        ungroupedProjects.map(renderProject)
      ),
      // 若沒有任何群組也沒有ungrouped，顯示新增提示
      groups.length===0&&ungroupedProjects.length===0&&h('div',{style:{padding:'16px',color:'#6b8299',fontSize:12,textAlign:'center'}},
        isAdmin?'點擊上方 + 建立第一個群組':'（尚無內容）'
      )
    ),
    // Bottom: Admin
    h('div',{style:{borderTop:'1px solid #33475c',padding:'12px 16px',color:'#8c99ad',fontSize:14,cursor:'pointer'}},'⚙ Admin 設定'),

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
      h(Input,{value:newGroupName,onChange:function(e){setNewGroupName(e.target.value);},placeholder:'群組名稱...',autoFocus:true,onPressEnter:doCreateGroup})
    ),

    // 新增專案
    h(Modal,{
      title:'新增專案',
      open:createProjGroupId!==null,
      onCancel:function(){setCreateProjGroupId(null);},
      width:400,
      footer:h(Space,null,
        h(Button,{onClick:function(){setCreateProjGroupId(null);}},'取消'),
        h(Button,{type:'primary',loading:creatingProj,onClick:doCreateProject},'建立')
      )},
      h('div',{style:{marginBottom:8,fontSize:13,color:'#73808c'}},'專案名稱'),
      h(Input,{value:newProjName,onChange:function(e){setNewProjName(e.target.value);},placeholder:'專案名稱...',autoFocus:true,onPressEnter:doCreateProject})
    ),

    // 新增資料夾
    h(Modal,{
      title:createCatParentId?'新增子資料夾':'新增資料夾',
      open:createCatProjId!==null,
      onCancel:function(){setCreateCatProjId(null);setCreateCatParentId(null);},
      width:400,
      footer:h(Space,null,
        h(Button,{onClick:function(){setCreateCatProjId(null);setCreateCatParentId(null);}},'取消'),
        h(Button,{type:'primary',loading:creatingCat,onClick:doCreateCategory},'建立')
      )},
      createCatParentId&&h('div',{style:{marginBottom:8,fontSize:12,color:'#8c99ad'}},'建立在「',
        (cats.find(function(c){return c.id===createCatParentId;})||{}).name||'',
        '」底下'),
      h('div',{style:{marginBottom:8,fontSize:13,color:'#73808c'}},'資料夾名稱'),
      h(Input,{value:newCatName,onChange:function(e){setNewCatName(e.target.value);},placeholder:'資料夾名稱...',autoFocus:true,onPressEnter:doCreateCategory})
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

// ── ListPage ─────────────────────────────────────────────────────────────────
function ListPage(){
  var _s=useState('');var search=_s[0];var setSearch=_s[1];
  var _sf=useState('all');var sf=_sf[0];var setSf=_sf[1];
  var _cat=useState(null);var activeCatId=_cat[0];var setActiveCatId=_cat[1];
  var _proj=useState(null);var activeProjectId=_proj[0];var setActiveProjectId=_proj[1];
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
  var _tt=useState('all');var typeTab=_tt[0];var setTypeTab=_tt[1];
  var _dq=useState('');var debouncedSearch=_dq[0];var setDebouncedSearch=_dq[1];
  useEffect(function(){
    var t=setTimeout(function(){setDebouncedSearch(search);},400);
    return function(){clearTimeout(t);};
  },[search]);
  var _dl=useDocList(debouncedSearch,activeCatId,typeTab==='all'?null:typeTab,sf,activeProjectId);
  var docs=_dl.data;var loading=_dl.loading;var reload=_dl.reload;
  var client=useAPIClient();
  var navigate=useNavigate();
  var docTypes=useOptions('docTypes');
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
        h('a',{onClick:function(e){e.stopPropagation();navigate('/admin/doc-hub/view/'+rec.id);},style:{fontWeight:500,color:'#1a1f2b',display:'inline-flex',alignItems:'center'}},
          h(FileTextOutlined,{style:{marginRight:6,color:'#1677ff',flexShrink:0}}),
          keyword?highlightText(text||'-',keyword):text||'-'
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
      return h(Tag,{color:s==='published'?'green':'default',style:{fontSize:14}},(s==='published'?'Published':'Draft'));
    }},
    {title:'最後更新',key:'upd',width:colWidths.upd,onHeaderCell:function(col){return{width:col.width,onResize:function(w){setColWidth('upd',w);}};},defaultSortOrder:'descend',sorter:function(a,b){return new Date(a.updatedAt||0)-new Date(b.updatedAt||0);},render:function(_,rec){
      var name=rec.lastEditor?(rec.lastEditor.nickname||rec.lastEditor.username||rec.lastEditor.email):null;
      var date=rec.updatedAt?new Date(rec.updatedAt).toLocaleString('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'-';
      return h('div',null,
        h('div',{style:{fontSize:15,color:'#1a1f26'}},date),
        name&&h('div',{style:{fontSize:14,color:'#8c99ad',marginTop:2}},h(UserOutlined,{style:{marginRight:3}}),name)
      );
    }},
    {title:'Git 同步',dataIndex:'gitSyncStatus',key:'gs',width:colWidths.gs,onHeaderCell:function(col){return{width:col.width,onResize:function(w){setColWidth('gs',w);}};},render:function(s,rec){return rec.githubRepo?syncBadge(s,rec):null;}},
    {title:'操作',key:'actions',width:155,render:function(_,rec){
      function goEdit(e){e.stopPropagation();navigate('/admin/doc-hub/edit/'+rec.id);}
      function goHistory(e){e.stopPropagation();navigate('/admin/doc-hub/versions/'+rec.id);}
      return h(Space,{size:4},
        h(Button,{size:'small',icon:h(EditOutlined),title:'編輯',onClick:goEdit}),
        h(Button,{size:'small',icon:h(HistoryOutlined),title:'歷史',onClick:goHistory}),
        h(Tooltip,{title:'移動到其他專案／資料夾'},
          h(Button,{size:'small',icon:h(SwapOutlined),onClick:function(e){e.stopPropagation();openMoveDoc(rec);}})
        ),
        !!rec.githubRepo&&h(Tooltip,{title:rec.status!=='published'?'請先發布':'同步到 Git'},
          h(Button,{size:'small',icon:h(SyncOutlined),disabled:rec.status!=='published',onClick:function(e){e.stopPropagation();setSyncDoc(rec);}})
        ),
        h(Tooltip,{title:'刪除文件'},
          h(Button,{size:'small',danger:true,icon:h(DeleteOutlined),onClick:function(e){e.stopPropagation();setDeleteDoc(rec);}})
        )
      );
    }}
  ];

  // Type tabs
  var tabs=[{key:'all',label:'全部'}].concat(docTypes.map(function(t){return{key:String(t.id),label:t.name};}));

  return h('div',{style:{display:'flex',minHeight:'100vh',background:'#f5f7fa'}},
    // Sidebar
    h(DocSidebar,{activeCatId:activeCatId,onSelectCat:setActiveCatId,activeProjectId:activeProjectId,onSelectProject:setActiveProjectId,search:search,onSearch:setSearch}),
    // Main content
    h('div',{style:{flex:1,display:'flex',flexDirection:'column',minWidth:0}},
      // Breadcrumb + title bar
      h('div',{style:{padding:'20px 32px 0'}},
        h('div',{style:{fontSize:13,color:'#73808c',marginBottom:4}},
          (function(){
            var parts=['Doc Hub'];
            if(activeProjectId){var p=allProjectsList.find(function(x){return x.id===activeProjectId;});if(p)parts.push(p.name);}
            if(activeCatId){var c=allCatsList.find(function(x){return x.id===activeCatId;});if(c)parts.push(c.name);}
            return parts.join(' › ');
          })()
        ),
        h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}},
          h('div',{style:{fontSize:24,fontWeight:700,color:'#1a1f26'}},(function(){
            if(activeCatId){var c=allCatsList.find(function(x){return x.id===activeCatId;});if(c)return c.name;}
            if(activeProjectId){var p=allProjectsList.find(function(x){return x.id===activeProjectId;});if(p)return p.name;}
            return 'Doc Hub';
          })()),
          h(Button,{type:'primary',icon:h(PlusOutlined),onClick:function(){
            var qs='';
            if(activeProjectId)qs+=(qs?'&':'?')+'projectId='+activeProjectId;
            if(activeCatId)qs+=(qs?'&':'?')+'categoryId='+activeCatId;
            navigate('/admin/doc-hub/edit/new'+qs);
          }},'新增文件')
        ),
        // Type tabs
        h('div',{style:{display:'flex',gap:24,borderBottom:'2px solid #ebedf0',marginBottom:0}},
          tabs.map(function(tab){
            var isActive=typeTab===tab.key;
            return h('div',{key:tab.key,
              style:{padding:'8px 0',fontSize:14,fontWeight:isActive?600:400,color:isActive?'#1677ff':'#73808c',
                borderBottom:isActive?'2px solid #1677ff':'2px solid transparent',marginBottom:-2,cursor:'pointer'},
              onClick:function(){setTypeTab(tab.key);}},
              tab.label
            );
          })
        )
      ),
      // Table card
      h('div',{style:{flex:1,padding:'0 32px 32px'}},
        h('div',{style:{background:'#fff',borderRadius:8,boxShadow:'0 1px 3px rgba(0,0,0,0.06)',marginTop:0}},
          h(Table,{dataSource:filtered,columns:columns,rowKey:'id',loading:loading,
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
          h('div',{style:{fontSize:13,fontWeight:600,color:'#667380',marginBottom:2}},'目標資料夾（可選）'),
          h(Select,{value:moveTargetCatId,onChange:setMoveTargetCatId,
            placeholder:moveTargetProjId?'選擇資料夾（可選）':'請先選擇專案',
            style:{width:'100%'},allowClear:true,disabled:!moveTargetProjId,
            options:moveCats.map(function(c){return{label:c.name,value:c.id};})})
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
    if(!document.getElementById('dochub-md-style')){
      var st=document.createElement('style');
      st.id='dochub-md-style';
      st.textContent=[
        '.dochub-preview table{border-collapse:collapse;width:100%;margin:12px 0}',
        '.dochub-preview th,.dochub-preview td{border:1px solid #333;padding:6px 12px;text-align:left;font-size:13px}',
        '.dochub-preview th{background:#f5f5f5;font-weight:600}',
        '.dochub-preview tr:nth-child(even) td{background:#fafafa}',
        '.dochub-preview pre{background:#f5f7fa;border-radius:6px;padding:12px 16px;overflow:auto;font-size:12px;line-height:1.6;margin:8px 0}',
        '.dochub-preview code{background:#f0f0f0;border-radius:3px;padding:1px 5px;font-size:12px}',
        '.dochub-preview pre code{background:transparent;padding:0}',
        '.dochub-preview h1{font-size:22px;font-weight:700;margin:20px 0 10px;border-bottom:2px solid #eee;padding-bottom:6px}',
        '.dochub-preview h2{font-size:18px;font-weight:700;margin:16px 0 8px}',
        '.dochub-preview h3{font-size:15px;font-weight:600;margin:12px 0 6px}',
        '.dochub-preview blockquote{border-left:4px solid #d9dee5;padding:4px 12px;margin:8px 0;color:#667380}',
        '.dochub-preview a{color:#1677ff}',
        '.dochub-preview ul,.dochub-preview ol{padding-left:20px;margin:8px 0}',
        '.dochub-preview li{margin:2px 0}',
        '.dochub-preview p{margin:8px 0}',
      ].join('\n');
      document.head.appendChild(st);
    }
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
      .then(function(res){setProjCats((res.data&&res.data.data)||[]);})
      .catch(function(){setProjCats([]);});
  },[client,form.projectId]);

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

  function setField(k,v){setForm(function(f){var nf={};for(var key in f)nf[key]=f[key];nf[k]=v;return nf;});}

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
      .then(function(){message.success('儲存成功');setSaving(false);setShowSaveModal(false);setChangeSummary('');if(isNew)navigate('/admin/doc-hub');})
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

  function handleSave(){
    if(!form.title||!form.title.trim()){message.warning('請先填寫文件標題');return;}
    if(isNew){doSave('');return;}
    // 非新文件，彈 Modal 讓使用者填 changeSummary
    setChangeSummary('');
    setShowSaveModal(true);
  }

  function handlePublish(){
    if(!form.title||!form.title.trim()){message.warning('請先填寫文件標題');return;}
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

  if(docLoading)return h('div',{style:{textAlign:'center',padding:80}},h(Spin,{size:'large'}));

  var isPublished=form.status==='published';
  var statusEl=isPublished
    ?h('div',{style:{background:'#e8fae8',borderRadius:6,padding:'6px 14px',color:'#52c41a',fontWeight:600,fontSize:13}},'Published ●')
    :h('div',{style:{background:'#f5f5f5',borderRadius:6,padding:'6px 14px',color:'#8c8c8c',fontWeight:600,fontSize:13}},'Draft ○');

  var fp='docs/'+(form.title||'untitled').replace(/\s+/g,'-').toLowerCase()+'.md';
  var diffLines=['--- a/'+fp,'+++ b/'+fp,'@@ -0,0 +1 @@','+# '+(form.title||'Document')];

  return h('div',{style:{minHeight:'100vh',background:'#fff',display:'flex',flexDirection:'column'}},

    // Header
    h('div',{style:{borderBottom:'1px solid #e5e9ef',padding:'10px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#fff',flexShrink:0}},
      h(Space,null,
        h(Button,{icon:h(ArrowLeftOutlined),onClick:function(){navigate('/admin/doc-hub');}},'返回'),
        h('span',{style:{color:'#ff4d4f',fontSize:16,marginRight:2}},'*'),
        h(Input,{value:form.title,onChange:function(e){setField('title',e.target.value);},placeholder:'文件標題（必填）',
          style:{width:400,fontWeight:700,fontSize:18,border:form.title&&form.title.trim()?'none':'1px solid #ff7875',boxShadow:'none',padding:'0 8px',borderRadius:4},size:'large'})
      ),
      h(Space,null,
        h(Button,{loading:saving,onClick:handleSave},'儲存'),
        h(Button,{type:'primary',style:{background:'#52c41a',borderColor:'#52c41a'},loading:saving,onClick:handlePublish},'發布'),
        !!form.githubRepo&&h(Tooltip,{title:isNew?'請先儲存':(!isPublished?'請先發布':'同步到 Git')},
          h(Button,{type:'primary',icon:h(SyncOutlined),disabled:isNew||!isPublished,onClick:function(){setShowSync(true);}},'同步 Git')
        )
      )
    ),

    // Meta bar: project + category + type + status
    h('div',{style:{borderBottom:'1px solid #f0f0f0',padding:'8px 24px',display:'flex',alignItems:'center',gap:20,background:'#fff',flexShrink:0,flexWrap:'wrap'}},
      h('div',{style:{display:'flex',alignItems:'center',gap:8}},
        h('span',{style:{fontSize:12,fontWeight:600,color:'#667380'}},'所屬專案'),
        h(Select,{value:form.projectId,onChange:function(v){setField('projectId',v);setField('categoryId',null);},
          placeholder:'選擇專案',style:{width:180},size:'small',allowClear:true,
          options:allProjects.map(function(p){return{label:p.name,value:p.id};})})
      ),
      h('div',{style:{display:'flex',alignItems:'center',gap:8}},
        h('span',{style:{fontSize:12,fontWeight:600,color:'#667380'}},'所屬資料夾'),
        h(Select,{value:form.categoryId,onChange:function(v){setField('categoryId',v);},
          placeholder:form.projectId?'選擇資料夾（可選）':'請先選專案',
          style:{width:200},size:'small',allowClear:true,disabled:!form.projectId,
          options:projCats.map(function(c){return{label:c.name,value:c.id};})})
      ),
      h('div',{style:{display:'flex',alignItems:'center',gap:8}},
        h('span',{style:{fontSize:12,fontWeight:600,color:'#667380'}},'文件類型'),
        h(Select,{value:form.typeId,onChange:function(v){setField('typeId',v);},placeholder:'選擇類型',style:{width:140},size:'small',allowClear:true,
          options:docTypes.map(function(t){return{label:t.name,value:t.id};})})
      ),
      h('div',{style:{display:'flex',alignItems:'center',gap:8}},
        h('span',{style:{fontSize:12,fontWeight:600,color:'#667380'}},'狀態'),
        h(Select,{value:form.status,onChange:function(v){setField('status',v);},style:{width:120},size:'small',
          options:[{label:'Draft',value:'draft'},{label:'Published',value:'published'}]})
      )
    ),

    // GitHub 綁定 bar
    h('div',{style:{borderBottom:'1px solid #f0f0f0',padding:'8px 24px',background:'#f6fff6',flexShrink:0,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}},
      h('span',{style:{fontSize:11,fontWeight:700,color:'#389e0d',flexShrink:0}},'🔗 GitHub 雙向同步'),
      h('div',{style:{display:'flex',alignItems:'center',gap:6}},
        h('span',{style:{fontSize:11,color:'#667380',flexShrink:0}},'Repo'),
        h(Input,{value:form.githubRepo,onChange:function(e){setField('githubRepo',e.target.value);},
          placeholder:'owner/repo 或 10.1.2.191/namespace/project',
          size:'small',style:{width:320,fontSize:12}})
      ),
      h('div',{style:{display:'flex',alignItems:'center',gap:6}},
        h('span',{style:{fontSize:11,color:'#667380',flexShrink:0}},'檔案路徑'),
        h(Input,{value:form.githubFilePath,onChange:function(e){setField('githubFilePath',e.target.value);},
          placeholder:'README.md 或 docs/spec.md',
          size:'small',style:{width:240,fontSize:12}})
      ),
      h('div',{style:{display:'flex',alignItems:'center',gap:6}},
        h('span',{style:{fontSize:11,color:'#667380',flexShrink:0}},'分支'),
        h(Input,{value:form.githubBranch,onChange:function(e){setField('githubBranch',e.target.value);},
          placeholder:'master / main（預設 master）',
          size:'small',style:{width:200,fontSize:12}})
      ),
      form.githubRepo&&h(Button,{size:'small',icon:h(SyncOutlined),onClick:doPullFromGit,loading:pulling,style:{fontSize:11}},isNew?'從 Git 拉取內容':'從 Git 拉取最新')
    ),

    // Permissions
    h('div',{style:{borderBottom:'1px solid #f0f0f0',padding:'12px 24px',background:'#fafcff',flexShrink:0}},
      h('div',{style:{display:'flex',gap:40}},
        h(PermissionPanel,{label:'Viewers',hint:'僅讀取權限。Editors / Subscribers 已自動包含讀取，通常只有「純看」的人才需要特別加這裡。',members:viewers,allUsers:allUsers,
          onAdd:function(u){setViewers(function(v){return v.find(function(x){return x.id===u.id;})?v:v.concat([u]);});},
          onRemove:function(u){setViewers(function(v){return v.filter(function(x){return x.id!==u.id;});});}}),
        h(PermissionPanel,{label:'Editors',hint:'可編輯，自動具備讀取權限',members:editors,allUsers:allUsers,
          onAdd:function(u){setEditors(function(v){return v.find(function(x){return x.id===u.id;})?v:v.concat([u]);});},
          onRemove:function(u){setEditors(function(v){return v.filter(function(x){return x.id!==u.id;});});}}),
        h(PermissionPanel,{label:'Subscribers',hint:'異動時自動收站內通知，自動具備讀取權限',members:subscribers,allUsers:allUsers,
          onAdd:function(u){setSubscribers(function(v){return v.find(function(x){return x.id===u.id;})?v:v.concat([u]);});},
          onRemove:function(u){setSubscribers(function(v){return v.filter(function(x){return x.id!==u.id;});});}})
      )
    ),

    // Editor area
    h('div',{style:{flex:1,display:'flex',flexDirection:'column',minHeight:0}},
      // Toolbar
      h('div',{style:{background:'#f7fafc',borderBottom:'1px solid #e0e5eb',padding:'6px 24px',display:'flex',alignItems:'center',gap:4,flexShrink:0}},
        h(Button,{size:'small',icon:h(BoldOutlined),title:'Bold',onClick:function(){insertMd('**','**');}}),
        h(Button,{size:'small',icon:h(ItalicOutlined),title:'Italic',onClick:function(){insertMd('_','_');}}),
        h(Button,{size:'small',icon:h(UnderlineOutlined),title:'Underline',onClick:function(){insertMd('<u>','</u>');}}),
        h(Divider,{type:'vertical'}),
        h(Button,{size:'small',title:'H1',onClick:function(){insertMd('# ','');}},h('b',null,'H1')),
        h(Button,{size:'small',title:'H2',onClick:function(){insertMd('## ','');}},h('b',null,'H2')),
        h(Button,{size:'small',title:'H3',onClick:function(){insertMd('### ','');}},h('b',null,'H3')),
        h(Divider,{type:'vertical'}),
        h(Button,{size:'small',icon:h(UnorderedListOutlined),title:'Bullet list',onClick:function(){insertMd('- ','');}}),
        h(Button,{size:'small',icon:h(OrderedListOutlined),title:'Numbered list',onClick:function(){insertMd('1. ','');}}),
        h(Divider,{type:'vertical'}),
        h(Button,{size:'small',icon:h(LinkOutlined),title:'Link',onClick:function(){insertMd('[','](url)');}}),
        h(Button,{size:'small',icon:h(CodeOutlined),title:'Code block',onClick:function(){insertMd('```\n','```');}})
      ),
      // Split pane
      h('div',{style:{flex:1,display:'flex',minHeight:0}},
        // Source
        h('div',{style:{flex:1,display:'flex',flexDirection:'column',borderRight:'1px solid #e0e5eb',background:'#fafafc'}},
          h('div',{style:{padding:'4px 24px',fontSize:10,fontWeight:600,color:'#8c949e',background:'#f7fafc',borderBottom:'1px solid #f0f0f0'}},'Markdown'),
          h('textarea',{id:'dochub-editor',value:form.content,onChange:function(e){setField('content',e.target.value);},
            style:{flex:1,width:'100%',height:'100%',fontFamily:'monospace',fontSize:13,padding:'16px 24px',border:'none',resize:'none',outline:'none',lineHeight:1.7,background:'#fafafc',boxSizing:'border-box'},
            placeholder:'Write Markdown here...'})
        ),
        // Preview
        h('div',{style:{flex:1,display:'flex',flexDirection:'column',background:'#fff'}},
          h('div',{style:{padding:'4px 24px',fontSize:10,fontWeight:600,color:'#8c949e',background:'#f7fafc',borderBottom:'1px solid #f0f0f0'}},'Preview'),
          form.content
            ?h('div',{key:String(markedReady),className:'dochub-preview',style:{flex:1,overflow:'auto',padding:'16px 24px',fontFamily:'system-ui,sans-serif',lineHeight:1.8,wordBreak:'break-word'},dangerouslySetInnerHTML:{__html:renderMarkdown(form.content)}})
            :h('div',{style:{flex:1,overflow:'auto',padding:'16px 24px',color:'#ccc',fontSize:13}},'Preview here...')
        )
      )
    ),

    // Git Sync Modal
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

    // 儲存備註 Modal
    h(Modal,{
      title:'儲存備註',
      open:!!showSaveModal,
      onCancel:function(){setShowSaveModal(false);setSaving(false);},
      width:440,
      footer:h(Space,null,
        h(Button,{onClick:function(){setShowSaveModal(false);setSaving(false);}},'取消'),
        h(Button,{type:'primary',loading:saving,disabled:!btnReady,onClick:function(){doSave(changeSummary,showSaveModal==='published'?'published':undefined);}},
          showSaveModal==='published'?'發布':'儲存')
      )},
      h('div',{style:{marginBottom:8,color:'#73808c',fontSize:13}},'選填：這次修改了什麼？（留空則顯示版本號）'),
      h(Input.TextArea,{
        value:changeSummary,
        onChange:function(e){setChangeSummary(e.target.value);},
        placeholder:'例：修正錯字、新增 API 範例...',
        maxLength:300,
        autoFocus:true,
        rows:4,
        autoSize:{minRows:3,maxRows:8}
      })
    ),

    // Git 衝突 Modal
    h(Modal,{
      title:h('span',null,h(ExclamationCircleOutlined,{style:{color:'#faad14',marginRight:8}}),'GitHub 版本衝突'),
      open:showConflict,
      onCancel:function(){setShowConflict(false);},
      width:480,
      footer:h(Space,null,
        h(Button,{onClick:function(){setShowConflict(false);}},'取消'),
        h(Button,{type:'primary',danger:true,loading:pulling,icon:h(SyncOutlined),onClick:doPullFromGit},'同步 GitHub 最新版本')
      )},
      h(Alert,{
        type:'warning',
        showIcon:true,
        message:'此文件的 GitHub 版本已有更新',
        description:'有人在 GitHub 上更新了這份文件。請先同步 GitHub 最新版本，再重新編輯後儲存。同步後你的未儲存變更將會遺失。',
        style:{marginBottom:0}
      })
    )
  );
}

// 簡易 line diff：回傳 [{type:'equal'|'add'|'remove', text}]
function computeLineDiff(oldText, newText){
  var oldLines=(oldText||'').split('\n');
  var newLines=(newText||'').split('\n');
  // Myers diff (simplified LCS-based)
  var m=oldLines.length, n=newLines.length;
  // dp[i][j] = LCS length
  var dp=[];
  for(var i=0;i<=m;i++){dp[i]=new Array(n+1).fill(0);}
  for(var i=1;i<=m;i++){
    for(var j=1;j<=n;j++){
      dp[i][j]=oldLines[i-1]===newLines[j-1]?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);
    }
  }
  // backtrack
  var result=[];
  var i=m,j=n;
  while(i>0||j>0){
    if(i>0&&j>0&&oldLines[i-1]===newLines[j-1]){
      result.push({type:'equal',text:oldLines[i-1]});i--;j--;
    } else if(j>0&&(i===0||dp[i][j-1]>=dp[i-1][j])){
      result.push({type:'add',text:newLines[j-1]});j--;
    } else {
      result.push({type:'remove',text:oldLines[i-1]});i--;
    }
  }
  result.reverse();
  return result;
}

function VersionPage(){
  var params=useParams();
  var docId=params.id;
  var navigate=useNavigate();
  var client=useAPIClient();
  var _v=useState([]);var versions=_v[0];var setVersions=_v[1];
  var _l=useState(true);var loading=_l[0];var setLoading=_l[1];
  var _sel=useState(null);var selected=_sel[0];var setSelected=_sel[1];
  var _dl=useDoc(docId);var doc=_dl.doc;

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

  var diffLines=selected
    ?computeLineDiff(prevVersion?prevVersion.content:'',selected.content||'')
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
                ver.changeSummary&&h('div',{style:{fontSize:11,color:'#a0aab5',marginTop:3,whiteSpace:'pre-wrap',wordBreak:'break-word'}},ver.changeSummary)
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
  var _mr=useState(!!window.marked);var markedReady=_mr[0];var setMarkedReady=_mr[1];
  useEffect(function(){
    loadMarked(function(){setMarkedReady(true);});
    if(!document.getElementById('dochub-md-style')){
      var st=document.createElement('style');
      st.id='dochub-md-style';
      st.textContent=[
        '.dochub-preview table{border-collapse:collapse;width:100%;margin:12px 0}',
        '.dochub-preview th,.dochub-preview td{border:1px solid #333;padding:6px 12px;text-align:left;font-size:13px}',
        '.dochub-preview th{background:#f5f5f5;font-weight:600}',
        '.dochub-preview tr:nth-child(even) td{background:#fafafa}',
        '.dochub-preview pre{background:#f5f7fa;border-radius:6px;padding:12px 16px;overflow:auto;font-size:12px;line-height:1.6;margin:8px 0}',
        '.dochub-preview code{background:#f0f0f0;border-radius:3px;padding:1px 5px;font-size:12px}',
        '.dochub-preview pre code{background:transparent;padding:0}',
        '.dochub-preview h1{font-size:22px;font-weight:700;margin:20px 0 10px;border-bottom:2px solid #eee;padding-bottom:6px}',
        '.dochub-preview h2{font-size:18px;font-weight:700;margin:16px 0 8px}',
        '.dochub-preview h3{font-size:15px;font-weight:600;margin:12px 0 6px}',
        '.dochub-preview blockquote{border-left:4px solid #d9dee5;padding:4px 12px;margin:8px 0;color:#667380}',
        '.dochub-preview a{color:#1677ff}',
        '.dochub-preview ul,.dochub-preview ol{padding-left:20px;margin:8px 0}',
        '.dochub-preview li{margin:2px 0}',
        '.dochub-preview p{margin:8px 0}',
      ].join('\n');
      document.head.appendChild(st);
    }
  },[]);

  if(loading||!currentUser)return h('div',{style:{textAlign:'center',padding:80}},h(Spin));

  // 權限判斷
  var isAdmin=currentUser.id===1||!!(currentUser.roles&&currentUser.roles.some(function(r){return r.name==='root'||r.name==='admin';}));
  var viewers=doc&&doc.viewers||[];
  var editors=doc&&doc.editors||[];
  var canView=isAdmin||!!(doc&&doc.authorId===currentUser.id)||viewers.some(function(v){return v.id===currentUser.id;});
  var canEdit=isAdmin||!!(doc&&doc.authorId===currentUser.id)||editors.some(function(v){return v.id===currentUser.id;});

  if(doc&&!canView){
    return h('div',{style:{textAlign:'center',padding:80}},
      h('div',{style:{fontSize:48,marginBottom:16}},'🔒'),
      h('div',{style:{fontSize:18,fontWeight:600,color:'#1a1f26',marginBottom:8}},'無法存取此文件'),
      h('div',{style:{color:'#73808c',marginBottom:24}},'你沒有查看此文件的權限'),
      h(Button,{onClick:function(){navigate('/admin/doc-hub');}},'返回列表')
    );
  }

  return h('div',{style:{minHeight:'100vh',background:'#f5f7fa',display:'flex',flexDirection:'column'}},
    // Header bar
    h('div',{style:{background:'#fff',borderBottom:'1px solid #f0f0f0',padding:'12px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10}},
      h(Space,null,
        h(Button,{icon:h(ArrowLeftOutlined),onClick:function(){navigate('/admin/doc-hub');}},'返回列表'),
        doc&&h(Tag,{color:doc.status==='published'?'green':'default'},doc.status==='published'?'Published':'Draft')
      ),
      canEdit&&h(Button,{type:'primary',icon:h(EditOutlined),onClick:function(){navigate('/admin/doc-hub/edit/'+docId);}},'編輯')
    ),
    // Content
    h('div',{style:{maxWidth:860,width:'100%',margin:'0 auto',padding:'40px 32px',flex:1}},
      doc
        ? h('div',null,
            // Title
            h('h1',{style:{fontSize:28,fontWeight:700,color:'#1a1f26',marginBottom:8,lineHeight:1.3}},doc.title),
            // Meta
            h('div',{style:{display:'flex',gap:16,alignItems:'center',marginBottom:32,paddingBottom:16,borderBottom:'1px solid #ebedf0',flexWrap:'wrap'}},
              doc.type&&h(Tag,{color:'blue'},doc.type.name),
              h('span',{style:{color:'#8c99ad',fontSize:12}},
                '最後更新：'+(doc.updatedAt?new Date(doc.updatedAt).toLocaleString('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'-')
              ),
              doc.lastEditor&&h('span',{style:{color:'#8c99ad',fontSize:12,display:'flex',alignItems:'center',gap:4}},
                h(UserOutlined,{style:{fontSize:11}}),
                '編輯者：'+(doc.lastEditor.nickname||doc.lastEditor.username||doc.lastEditor.email)
              )
            ),
            // Body
            doc.content
              ? h('div',{key:String(markedReady),className:'dochub-preview',style:{fontSize:15,lineHeight:1.85,color:'#2c3340',fontFamily:'system-ui,sans-serif',wordBreak:'break-word'},dangerouslySetInnerHTML:{__html:renderMarkdown(doc.content)}})
              : h('div',{style:{color:'#bbb',fontSize:14,padding:'40px 0',textAlign:'center'}},'（此文件尚無內容）')
          )
        : h('div',{style:{textAlign:'center',padding:80,color:'#999'}},'文件不存在')
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
      console.log('[DocHub] routes registered');
    });
  };
  return DocHubPlugin;
}(Plugin);

}(),exports$}()});
