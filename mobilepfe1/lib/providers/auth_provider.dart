import 'package:flutter/foundation.dart';
import '../services/auth_service.dart';
import '../models/user.dart';
import '../services/user_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  final UserService _userService = UserService();
  
  bool _isLoading = false;
  bool _isLoggedIn = false;
  String? _token;
  String? _userId;
  String? _userRole;
  User? _user;
  String? _error;
  
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _isLoggedIn;
  String? get token => _token;
  String? get userId => _userId;
  String? get userRole => _userRole;
  User? get user => _user;
  String? get error => _error;
  
  AuthProvider() {
    _checkLoginStatus();
  }
  
  Future<void> _checkLoginStatus() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      _isLoggedIn = await _authService.isLoggedIn();
      
      if (_isLoggedIn) {
        _token = await _authService.getToken();
        _userId = await _authService.getUserId();
        _userRole = await _authService.getUserRole();
        
        // Récupérer les informations de l'utilisateur
        await _loadUserProfile();
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final result = await _authService.login(email, password);
      
      if (result['success']) {
        _isLoggedIn = true;
        _token = result['token'];
        _userId = result['userId'].toString();
        _userRole = result['role'];
        
        // Récupérer les informations de l'utilisateur
        await _loadUserProfile();
        
        notifyListeners();
        return true;
      } else {
        _error = result['message'];
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> _loadUserProfile() async {
    try {
      _user = await _userService.getUserProfile();
    } catch (e) {
      _error = e.toString();
    }
  }
  
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      await _authService.logout();
      _isLoggedIn = false;
      _token = null;
      _userId = null;
      _userRole = null;
      _user = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Mettre à jour les informations de l'utilisateur
  void updateUser(User updatedUser) {
    _user = updatedUser;
    notifyListeners();
    
    // Dans une vraie application, vous enverriez ces informations au serveur
    // via un service API
    // _userService.updateUser(updatedUser);
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
