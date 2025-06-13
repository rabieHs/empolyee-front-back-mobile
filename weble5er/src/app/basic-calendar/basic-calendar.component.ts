import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-basic-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="padding: 20px;">
      <h1>PLANNING DES CONGES</h1>
      <div style="margin-bottom: 20px;">
        <button routerLink="/home" style="padding: 8px 15px; background-color: #3f51b5; color: white; border: none; border-radius: 4px;">
          Retour au tableau de bord
        </button>
      </div>
      
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">SALARIES</th>
            <th colspan="7" style="border: 1px solid #ddd; padding: 8px; background-color: #ff9800; color: white; text-align: center;">
              19 - 25 déc. 2022
            </th>
          </tr>
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px;"></th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">L<br>19</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">M<br>20</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">M<br>21</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">J<br>22</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">V<br>23</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">S<br>24</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">D<br>25</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">ALAIN</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #a8e6a8;">Congés</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #a8e6a8;">Congés</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #a8e6a8;">Congés</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #a8e6a8;">Congés</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #a8e6a8;">Congés</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">ANDRÉA</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">DENIS</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">ERIC</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #ffb3b3;">Maladie</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #ffb3b3;">Maladie</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #ffb3b3;">Maladie</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">FRANCIS</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">LUCIE</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">MARC</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #a8e6a8;">Congés</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #a8e6a8;">Congés</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #a8e6a8;">Congés</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #a8e6a8;">Congés</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #a8e6a8;">Congés</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"></td>
          </tr>
        </tbody>
      </table>
      
      <div style="margin-top: 20px;">
        <h3>Légende</h3>
        <div style="display: flex; margin-top: 10px;">
          <div style="display: flex; align-items: center; margin-right: 20px;">
            <div style="width: 20px; height: 20px; background-color: #a8e6a8; margin-right: 5px;"></div>
            <span>Congés</span>
          </div>
          <div style="display: flex; align-items: center; margin-right: 20px;">
            <div style="width: 20px; height: 20px; background-color: #b3d9ff; margin-right: 5px;"></div>
            <span>Sans solde</span>
          </div>
          <div style="display: flex; align-items: center;">
            <div style="width: 20px; height: 20px; background-color: #ffb3b3; margin-right: 5px;"></div>
            <span>Maladie</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BasicCalendarComponent {
  // Aucune logique, juste un affichage statique
}
