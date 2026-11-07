# espelhar.ps1 - Sincroniza os repos antigos (deploy) com o monorepo PIPonteEdital
#
# Uso:  .\espelhar.ps1
#
# O que faz, para cada repo (FrontEnd, Backend, webscrapping):
#   1. git push no repo antigo  -> dispara deploy (Vercel / Render)
#   2. git subtree pull         -> traz os commits pro repo novo (espelho)
#   3. git push no repo novo    -> GitHub do PIPonteDoEdital atualizado
#
# Regra: edite SEMPRE na pasta antiga (C:\Users\USER\Desktop\PonteEdital\...).

$ErrorActionPreference = 'Stop'

$monorepo  = 'C:\Users\USER\Desktop\PIPonteEdital'
$raizAntiga = 'C:\Users\USER\Desktop\PonteEdital'

$repos = @(
    @{ Nome = 'FrontEnd';     Path = "$raizAntiga\FrontEnd";     Prefixo = 'FrontEnd' },
    @{ Nome = 'Backend';      Path = "$raizAntiga\Backend";      Prefixo = 'Backend' },
    @{ Nome = 'webscrapping'; Path = "$raizAntiga\webscrapping"; Prefixo = 'webscrapping' }
)

function Passo($msg)  { Write-Host "==> $msg" -ForegroundColor Cyan }
function Ok($msg)     { Write-Host "    $msg" -ForegroundColor Green }
function Aviso($msg)  { Write-Host "    $msg" -ForegroundColor Yellow }
function Erro($msg)   { Write-Host "    ERRO: $msg" -ForegroundColor Red }

Set-Location $monorepo

# --- monorepo precisa estar limpo (git subtree pull exige) ---
$sujo = git status --porcelain
if ($sujo) {
    Write-Host "ABORTADO: o monorepo tem alteracoes nao commitadas. Commit/descarte antes:" -ForegroundColor Red
    $sujo
    exit 1
}
Ok "monorepo limpo"

# --- cada repo antigo: push (deploy) + espelho ---
foreach ($repo in $repos) {
    Passo $repo.Nome

    if (-not (Test-Path (Join-Path $repo.Path '.git'))) {
        Aviso "repositorio nao encontrado em $($repo.Path) - pulando"
        continue
    }

    git -C $repo.Path fetch origin
    if ($LASTEXITCODE -ne 0) { Erro "git fetch falhou em $($repo.Path)"; exit 1 }

    $naoEnviados = [int](git -C $repo.Path rev-list --count "origin/main..main")
    if ($naoEnviados -gt 0) {
        Ok "$naoEnviados commit(s) local(is) nao enviado(s) -> push (deploy dispara)"
        git -C $repo.Path push origin main
        if ($LASTEXITCODE -ne 0) { Erro "git push falhou em $($repo.Nome)"; exit 1 }
    } else {
        Ok "push: tudo em dia"
    }

    $sha = git -C $repo.Path rev-parse --short main
    if ($LASTEXITCODE -ne 0) { Erro "rev-parse falhou em $($repo.Nome)"; exit 1 }
    git subtree pull --prefix=$($repo.Prefixo) -m "Espelho de $($repo.Nome) @ $sha" $repo.Path main
    if ($LASTEXITCODE -ne 0) { Erro "subtree pull falhou em $($repo.Nome)"; exit 1 }
    Ok "espelhado em $($repo.Prefixo)/"
}

# --- push do monorepo (repo novo) ---
Passo "repo novo (PIPonteDoEdital)"
$naoEnviadosMono = [int](git rev-list --count "origin/main..main")
if ($naoEnviadosMono -gt 0) {
    git push origin main
    if ($LASTEXITCODE -ne 0) { Erro "git push do monorepo falhou"; exit 1 }
    Ok "$naoEnviadosMono commit(s) enviado(s) para github.com/iamraiane/PIPonteDoEdital"
} else {
    Ok "repo novo ja esta atualizado"
}

Write-Host ""
Write-Host "Feito! Deploy dispara nos repos antigos; espelho atualizado no repo novo." -ForegroundColor Cyan
