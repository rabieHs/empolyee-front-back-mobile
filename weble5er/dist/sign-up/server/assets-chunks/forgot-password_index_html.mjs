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

.forgot-password-container[_ngcontent-ng-c3882069883] {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}
.form-box[_ngcontent-ng-c3882069883] {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}
h2[_ngcontent-ng-c3882069883] {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}
.instruction[_ngcontent-ng-c3882069883] {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}
.input-box[_ngcontent-ng-c3882069883] {
  position: relative;
  margin-bottom: 20px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
}
.input-box[_ngcontent-ng-c3882069883]   input[_ngcontent-ng-c3882069883] {
  width: 100%;
  padding: 15px 45px 15px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}
.input-box[_ngcontent-ng-c3882069883]   input[_ngcontent-ng-c3882069883]:focus {
  border-color: #007bff;
  outline: none;
}
.input-box[_ngcontent-ng-c3882069883]   i[_ngcontent-ng-c3882069883] {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}
.error-message[_ngcontent-ng-c3882069883] {
  color: #dc3545;
  text-align: center;
  margin-bottom: 15px;
}
.success-message[_ngcontent-ng-c3882069883] {
  color: #28a745;
  text-align: center;
  margin-bottom: 15px;
}
.btn[_ngcontent-ng-c3882069883] {
  width: 100%;
  padding: 15px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s ease;
}
.btn[_ngcontent-ng-c3882069883]:not(:disabled):hover {
  background: #0056b3;
}
.btn[_ngcontent-ng-c3882069883]:disabled {
  background: #ccc;
  cursor: not-allowed;
}
.back-to-login[_ngcontent-ng-c3882069883] {
  text-align: center;
  margin-top: 20px;
}
.back-to-login[_ngcontent-ng-c3882069883]   a[_ngcontent-ng-c3882069883] {
  color: #007bff;
  cursor: pointer;
  text-decoration: underline;
}
.back-to-login[_ngcontent-ng-c3882069883]   a[_ngcontent-ng-c3882069883]:hover {
  text-decoration: underline;
}
.reset-link-box[_ngcontent-ng-c3882069883] {
  text-align: center;
}
.reset-link-box[_ngcontent-ng-c3882069883]   .success-icon[_ngcontent-ng-c3882069883] {
  margin-bottom: 15px;
}
.reset-link-box[_ngcontent-ng-c3882069883]   .success-icon[_ngcontent-ng-c3882069883]   i[_ngcontent-ng-c3882069883] {
  font-size: 48px;
  color: #28a745;
}
.reset-link-box[_ngcontent-ng-c3882069883]   h3[_ngcontent-ng-c3882069883] {
  margin-bottom: 10px;
  color: #28a745;
}
.reset-link-box[_ngcontent-ng-c3882069883]   p[_ngcontent-ng-c3882069883] {
  margin-bottom: 20px;
  color: #666;
}
.reset-link-box[_ngcontent-ng-c3882069883]   .reset-link[_ngcontent-ng-c3882069883] {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
  word-break: break-all;
}
.reset-link-box[_ngcontent-ng-c3882069883]   .reset-link[_ngcontent-ng-c3882069883]   a[_ngcontent-ng-c3882069883] {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}
.reset-link-box[_ngcontent-ng-c3882069883]   .reset-link[_ngcontent-ng-c3882069883]   a[_ngcontent-ng-c3882069883]:hover {
  text-decoration: underline;
}
/*# sourceMappingURL=/forgot-password.component.css.map */</style></head>
<body><!--nghm--><script type="text/javascript" id="ng-event-dispatch-contract">(()=>{function p(t,n,r,o,e,i,f,m){return{eventType:t,event:n,targetElement:r,eic:o,timeStamp:e,eia:i,eirp:f,eiack:m}}function u(t){let n=[],r=e=>{n.push(e)};return{c:t,q:n,et:[],etc:[],d:r,h:e=>{r(p(e.type,e,e.target,t,Date.now()))}}}function s(t,n,r){for(let o=0;o<n.length;o++){let e=n[o];(r?t.etc:t.et).push(e),t.c.addEventListener(e,t.h,r)}}function c(t,n,r,o,e=window){let i=u(t);e._ejsas||(e._ejsas={}),e._ejsas[n]=i,s(i,r),s(i,o,!0)}window.__jsaction_bootstrap=c;})();
</script><script>window.__jsaction_bootstrap(document.body,"ng",["submit","input","compositionstart","compositionend","click"],["blur"]);</script>
  <app-root ng-version="19.1.6" ngh="1" ng-server-context="ssg"><router-outlet></router-outlet><app-forgot-password _nghost-ng-c3882069883="" ngh="0"><div _ngcontent-ng-c3882069883="" class="forgot-password-container"><div _ngcontent-ng-c3882069883="" class="form-box"><h2 _ngcontent-ng-c3882069883="">Réinitialisation du mot de passe</h2><p _ngcontent-ng-c3882069883="" class="instruction">Entrez votre adresse e-mail pour réinitialiser votre mot de passe</p><form _ngcontent-ng-c3882069883="" novalidate="" class="ng-untouched ng-pristine ng-invalid" jsaction="submit:;"><div _ngcontent-ng-c3882069883="" class="input-box"><input _ngcontent-ng-c3882069883="" type="email" name="email" placeholder="Adresse e-mail" required="" ng-reflect-required="" ng-reflect-name="email" ng-reflect-model="" class="ng-untouched ng-pristine ng-invalid" value="" jsaction="input:;blur:;compositionstart:;compositionend:;"><i _ngcontent-ng-c3882069883="" class="bx bxs-envelope"></i></div><!--bindings={
  "ng-reflect-ng-if": ""
}--><button _ngcontent-ng-c3882069883="" type="submit" class="btn"><span _ngcontent-ng-c3882069883="">Réinitialiser le mot de passe</span><!--bindings={
  "ng-reflect-ng-if": "true"
}--><!--bindings={
  "ng-reflect-ng-if": "false"
}--></button><p _ngcontent-ng-c3882069883="" class="back-to-login"><a _ngcontent-ng-c3882069883="" jsaction="click:;">Retour à la connexion</a></p></form><!--bindings={
  "ng-reflect-ng-if": "true"
}--><!--bindings={
  "ng-reflect-ng-if": null
}--></div></div></app-forgot-password><!--container--></app-root>
<script src="polyfills.js" type="module"></script><script src="main.js" type="module"></script>

<script id="ng-state" type="application/json">{"__nghData__":[{"t":{"6":"t0","7":"t4"},"c":{"6":[{"i":"t0","r":1,"t":{"4":"t1","6":"t2","7":"t3"},"c":{"4":[],"6":[{"i":"t2","r":1}],"7":[]}}],"7":[]}},{"c":{"0":[{"i":"c3882069883","r":1}]}}]}</script></body></html>`;