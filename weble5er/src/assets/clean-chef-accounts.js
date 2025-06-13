// Script pour supprimer tous les comptes de chef sauf celui avec l'email chef@aya.com
(function() {
  // Récupérer les utilisateurs du localStorage
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  console.log('Nombre d\'utilisateurs avant nettoyage:', users.length);
  
  // Filtrer pour garder tous les utilisateurs qui ne sont pas des chefs
  // et le chef avec l'email chef@aya.com
  const filteredUsers = users.filter(user => 
    user.role !== 'chef' || user.email === 'chef@aya.com'
  );
  
  console.log('Nombre d\'utilisateurs après nettoyage:', filteredUsers.length);
  console.log('Utilisateurs supprimés:', users.length - filteredUsers.length);
  
  // Enregistrer les utilisateurs filtrés dans le localStorage
  localStorage.setItem('users', JSON.stringify(filteredUsers));
  
  // Afficher les utilisateurs restants
  console.log('Utilisateurs restants:', filteredUsers);
  
  // Vérifier si le chef avec l'email chef@aya.com existe toujours
  const chefExists = filteredUsers.some(user => user.email === 'chef@aya.com');
  console.log('Le chef avec l\'email chef@aya.com existe:', chefExists);
  
  return 'Nettoyage terminé. Tous les comptes de chef ont été supprimés sauf celui avec l\'email chef@aya.com.';
})();
