$filePath = "C:\Users\user\Downloads\webpfe11-master\webpfe11-master\src\app\home\requests\requests.service.ts"
$content = Get-Content -Path $filePath -Raw

# Correction 1: Ligne 500 - Remplacer "return '';" par "return of('');"
$content = $content -replace "if \(!currentUser\) return '';", "if (!currentUser) return of('');"

# Correction 2: Ligne 544 - Modifier le type de retour de addTrainingRequest
$content = $content -replace "addTrainingRequest\(data: \{[^}]*\}\): string \{", "addTrainingRequest(data: {
    title: string;
    organization: string;
    startDate: string;
    endDate: string;
    trainingType: string;
    objectives: string;
    cost: number;
    department?: string;
    theme?: string;
    topic?: string;
  }): Observable<string> {"

# Correction 3: Ligne 573 - Modifier le type de retour de addCertificateRequest
$content = $content -replace "addCertificateRequest\(data: \{[^}]*\}\): string \{", "addCertificateRequest(data: {
    purpose: string;
    otherPurpose?: string;
    language: string;
    copies: number;
    comments?: string;
  }): Observable<string> {"

# Correction 4: Ligne 594 - Modifier le type de retour de addDocumentRequest
$content = $content -replace "addDocumentRequest\(data: \{[^}]*\}\): string \{", "addDocumentRequest(data: {
    documentType: string;
    urgency: boolean;
    additionalInfo?: string;
  }): Observable<string> {"

# Correction 5: Ligne 619 - Modifier le type de retour de addLoanRequest
$content = $content -replace "addLoanRequest\(data: FormData\): string \{", "addLoanRequest(data: FormData): Observable<string> {"

# Correction 6: Ligne 638 - Modifier le type de retour de addAdvanceRequest
$content = $content -replace "addAdvanceRequest\(data: FormData\): string \{", "addAdvanceRequest(data: FormData): Observable<string> {"

# Correction des return '' dans ces méthodes
$content = $content -replace "if \(!currentUser\) return '';", "if (!currentUser) return of('');"

# Sauvegarder les modifications
$content | Set-Content -Path $filePath

Write-Host "Les erreurs de type ont été corrigées dans le fichier requests.service.ts"
