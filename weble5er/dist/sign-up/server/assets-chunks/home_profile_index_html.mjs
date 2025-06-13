export default `<!DOCTYPE html><html lang="en"><head>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <meta charset="utf-8">
  <title>SignUp</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="styles.css"><style ng-app-id="ng">

.login-container[_ngcontent-ng-c2488496235] {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(
      135deg,
      #1e3c72 0%,
      #2a5298 100%);
  padding: 2rem;
}
.login-card[_ngcontent-ng-c2488496235] {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}
h2[_ngcontent-ng-c2488496235] {
  color: #2c3e50;
  margin-bottom: 2rem;
  text-align: center;
}
.form-group[_ngcontent-ng-c2488496235] {
  margin-bottom: 1.5rem;
}
label[_ngcontent-ng-c2488496235] {
  display: block;
  margin-bottom: 0.5rem;
  color: #34495e;
  font-size: 0.9rem;
}
input[_ngcontent-ng-c2488496235] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}
input[_ngcontent-ng-c2488496235]:focus {
  outline: none;
  border-color: #3498db;
}
.error-message[_ngcontent-ng-c2488496235] {
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}
button[_ngcontent-ng-c2488496235] {
  width: 100%;
  padding: 1rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
button[_ngcontent-ng-c2488496235]:hover {
  background: #2980b9;
}
button[_ngcontent-ng-c2488496235]:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}
.links[_ngcontent-ng-c2488496235] {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
  font-size: 0.9rem;
}
.links[_ngcontent-ng-c2488496235]   a[_ngcontent-ng-c2488496235] {
  color: #3498db;
  text-decoration: none;
  cursor: pointer;
}
.links[_ngcontent-ng-c2488496235]   a[_ngcontent-ng-c2488496235]:hover {
  text-decoration: underline;
}
/*# sourceMappingURL=/login.component.css.map */</style></head>
<body><!--nghm--><script type="text/javascript" id="ng-event-dispatch-contract">(()=>{function p(t,n,r,o,e,i,f,m){return{eventType:t,event:n,targetElement:r,eic:o,timeStamp:e,eia:i,eirp:f,eiack:m}}function u(t){let n=[],r=e=>{n.push(e)};return{c:t,q:n,et:[],etc:[],d:r,h:e=>{r(p(e.type,e,e.target,t,Date.now()))}}}function s(t,n,r){for(let o=0;o<n.length;o++){let e=n[o];(r?t.etc:t.et).push(e),t.c.addEventListener(e,t.h,r)}}function c(t,n,r,o,e=window){let i=u(t);e._ejsas||(e._ejsas={}),e._ejsas[n]=i,s(i,r),s(i,o,!0)}window.__jsaction_bootstrap=c;})();
</script><script>window.__jsaction_bootstrap(document.body,"ng",["submit","input","compositionstart","compositionend","click"],["blur"]);</script>
  <app-root ng-version="19.1.6" ngh="1" ng-server-context="ssg"><router-outlet></router-outlet><app-login _nghost-ng-c2488496235="" ngh="0"><div _ngcontent-ng-c2488496235="" class="login-container"><div _ngcontent-ng-c2488496235="" class="login-card"><h2 _ngcontent-ng-c2488496235="">Connexion</h2><form _ngcontent-ng-c2488496235="" novalidate="" class="ng-untouched ng-pristine ng-invalid" jsaction="submit:;"><div _ngcontent-ng-c2488496235="" class="form-group"><label _ngcontent-ng-c2488496235="" for="email">Email</label><input _ngcontent-ng-c2488496235="" type="email" id="email" name="email" required="" email="" ng-reflect-required="" ng-reflect-email="" ng-reflect-name="email" ng-reflect-model="" class="ng-untouched ng-pristine ng-invalid" value="" jsaction="input:;blur:;compositionstart:;compositionend:;"><!--bindings={
  "ng-reflect-ng-if": "false"
}--></div><div _ngcontent-ng-c2488496235="" class="form-group"><label _ngcontent-ng-c2488496235="" for="password">Mot de passe</label><input _ngcontent-ng-c2488496235="" type="password" id="password" name="password" required="" minlength="6" ng-reflect-required="" ng-reflect-minlength="6" ng-reflect-name="password" ng-reflect-model="" class="ng-untouched ng-pristine ng-invalid" value="" jsaction="input:;blur:;compositionstart:;compositionend:;"><!--bindings={
  "ng-reflect-ng-if": "false"
}--></div><!--bindings={
  "ng-reflect-ng-if": "false"
}--><button _ngcontent-ng-c2488496235="" type="submit" disabled=""><!--bindings={
  "ng-reflect-ng-if": "false"
}--><span _ngcontent-ng-c2488496235="">Se connecter</span><!--bindings={
  "ng-reflect-ng-if": "true"
}--></button><div _ngcontent-ng-c2488496235="" class="links"><a _ngcontent-ng-c2488496235="" jsaction="click:;">Mot de passe oublié ?</a><a _ngcontent-ng-c2488496235="" jsaction="click:;">Créer un compte</a></div></form></div></div></app-login><!--container--></app-root>
<script src="polyfills.js" type="module"></script><script src="main.js" type="module"></script>

<script id="ng-state" type="application/json">{"__nghData__":[{"t":{"11":"t5","17":"t6","18":"t7","20":"t8","21":"t9"},"c":{"11":[],"17":[],"18":[],"20":[],"21":[{"i":"t9","r":1}]}},{"c":{"0":[{"i":"c2488496235","r":1}]}}]}</script></body></html>`;