$ErrorActionPreference = 'Stop'

function Get-SkillFrontmatter {
    param(
        [Parameter(Mandatory)] [string] $Conteudo,
        [Parameter(Mandatory)] [string] $Origem
    )

    $padrao = '\A---\r?\n(?<yaml>.*?)\r?\n---(?:\r?\n|\z)'
    $resultado = [regex]::Match(
        $Conteudo,
        $padrao,
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )
    if (-not $resultado.Success) {
        throw "Frontmatter delimitado ausente ou inválido: $Origem"
    }

    $frontmatter = $resultado.Groups['yaml'].Value
    if ($frontmatter -notmatch '(?m)^name:\s*[a-z0-9-]+\s*$') {
        throw "Campo name ausente no frontmatter: $Origem"
    }
    if ($frontmatter -notmatch '(?m)^description:\s*\S.+$') {
        throw "Campo description ausente no frontmatter: $Origem"
    }

    return $frontmatter
}

$frontmatterValidoExemplo = @'
---
name: exemplo
description: Use quando o exemplo for solicitado.
---

Corpo.
'@
$frontmatterExemplo = Get-SkillFrontmatter -Conteudo $frontmatterValidoExemplo -Origem 'exemplo válido'
if ($frontmatterExemplo -notmatch '(?m)^name:\s*exemplo\s*$') {
    throw 'Parser de frontmatter não preservou o nome.'
}

$casosFrontmatterInvalidos = @(
    @{ Nome = 'sem delimitadores'; Conteudo = "name: exemplo`ndescription: exemplo`nCorpo." },
    @{ Nome = 'sem description'; Conteudo = "---`nname: exemplo`n---`nCorpo." }
)
foreach ($caso in $casosFrontmatterInvalidos) {
    $rejeitado = $false
    try {
        $null = Get-SkillFrontmatter -Conteudo $caso.Conteudo -Origem $caso.Nome
    }
    catch {
        $rejeitado = $true
    }
    if (-not $rejeitado) {
        throw "Frontmatter inválido aceito: $($caso.Nome)"
    }
}

$raiz = Split-Path -Parent $PSScriptRoot
$esperadas = @(
    'inicializar',
    'mapear-legado',
    'descobrir',
    'refinar',
    'planejar',
    'analisar',
    'prototipar',
    'implementar',
    'revisar',
    'sintetizar-contexto',
    'comunicar-enxuto'
)

$agents = Join-Path $raiz 'AGENTS.md'
if (-not (Test-Path -LiteralPath $agents)) {
    throw 'AGENTS.md ausente.'
}

$conteudoAgents = Get-Content -Raw -LiteralPath $agents
if ($conteudoAgents -notmatch '(?m)^# Núcleo SDD$') {
    throw 'AGENTS.md não identifica o Núcleo SDD.'
}
if ($conteudoAgents -notmatch '(?s)refinar.+descoberta.+(planejar|planejamento).+gate.+implementar.+revisar') {
    throw 'AGENTS.md não descreve o fluxo obrigatório até a revisão.'
}
if ($conteudoAgents -notmatch '(?s)prototipar.+somente.+solicita') {
    throw 'AGENTS.md não limita prototipar a solicitação explícita.'
}

$claude = Join-Path $raiz 'CLAUDE.md'
if (-not (Test-Path -LiteralPath $claude)) {
    throw 'CLAUDE.md ausente.'
}

$conteudoClaude = Get-Content -Raw -LiteralPath $claude
if ($conteudoClaude.Trim() -ne '@AGENTS.md') {
    throw 'CLAUDE.md deve importar AGENTS.md sem duplicar suas instruções.'
}

$raizSkills = Join-Path $raiz '.agents/skills'
if (-not (Test-Path -LiteralPath $raizSkills)) {
    throw 'Diretório .agents/skills ausente.'
}

$encontradas = @(Get-ChildItem -LiteralPath $raizSkills -Directory |
    Select-Object -ExpandProperty Name |
    Sort-Object)

if (Compare-Object -ReferenceObject ($esperadas | Sort-Object) -DifferenceObject $encontradas) {
    throw 'Conjunto de skills inesperado.'
}

$termosBloqueados = @(('Az' + 'ure'), ('Dev' + 'Ops'), ('Cla' + 'ude'))
foreach ($nome in $esperadas) {
    $arquivo = Join-Path $raizSkills "$nome/SKILL.md"
    if (-not (Test-Path -LiteralPath $arquivo)) {
        throw "Skill ausente: $nome"
    }

    $conteudo = Get-Content -Raw -LiteralPath $arquivo
    $frontmatter = Get-SkillFrontmatter -Conteudo $conteudo -Origem $arquivo
    if ($frontmatter -notmatch "(?m)^name:\s*$([regex]::Escape($nome))\s*$") {
        throw "Nome da skill não coincide com a pasta: $nome"
    }
    foreach ($termo in $termosBloqueados) {
        if ($conteudo -match [regex]::Escape($termo)) {
            throw "Referência removida em $nome"
        }
    }
}

$conteudoDescobrir = Get-Content -Raw -LiteralPath (Join-Path $raizSkills 'descobrir/SKILL.md')
if ($conteudoDescobrir -notmatch '(?s)modo embutido.+retorn.+refinar') {
    throw 'descobrir não define retorno ao refinar no modo embutido.'
}

$conteudoRefinar = Get-Content -Raw -LiteralPath (Join-Path $raizSkills 'refinar/SKILL.md')
if ($conteudoRefinar -notmatch '(?s)descoberta.+planejar.+automatic') {
    throw 'refinar não orquestra descoberta e planejamento automático.'
}

$conteudoPlanejar = Get-Content -Raw -LiteralPath (Join-Path $raizSkills 'planejar/SKILL.md')
if ($conteudoPlanejar -notmatch '(?s)Gate de implementação.+aprovação (humana )?explícita') {
    throw 'planejar não encerra no gate de implementação.'
}

$conteudoPrototipar = Get-Content -Raw -LiteralPath (Join-Path $raizSkills 'prototipar/SKILL.md')
if ($conteudoPrototipar -notmatch '(?s)somente.+solicita') {
    throw 'prototipar não exige solicitação explícita.'
}
if ($conteudoPrototipar -match '(?i)dispensad') {
    throw 'prototipar ainda exige registrar dispensa.'
}

$politicaPrototipar = Join-Path $raizSkills 'prototipar/agents/openai.yaml'
if (-not (Test-Path -LiteralPath $politicaPrototipar)) {
    throw 'Política Codex de prototipação explícita ausente.'
}
if ((Get-Content -Raw -LiteralPath $politicaPrototipar) -notmatch '(?m)^\s*allow_implicit_invocation:\s*false\s*$') {
    throw 'Codex ainda permite invocação implícita de prototipar.'
}

$raizSkillsClaude = Join-Path $raiz '.claude/skills'
if (-not (Test-Path -LiteralPath $raizSkillsClaude)) {
    throw 'Diretório .claude/skills ausente.'
}

$encontradasClaude = @(Get-ChildItem -LiteralPath $raizSkillsClaude -Directory |
    Select-Object -ExpandProperty Name |
    Sort-Object)

if (Compare-Object -ReferenceObject $encontradas -DifferenceObject $encontradasClaude) {
    throw 'Catálogos de skills do Codex e Claude divergem.'
}

foreach ($nome in $esperadas) {
    $adaptador = Join-Path $raizSkillsClaude "$nome/SKILL.md"
    if (-not (Test-Path -LiteralPath $adaptador)) {
        throw "Adaptador Claude ausente: $nome"
    }

    $conteudo = Get-Content -Raw -LiteralPath $adaptador
    $frontmatter = Get-SkillFrontmatter -Conteudo $conteudo -Origem $adaptador
    if ($frontmatter -notmatch "(?m)^name:\s*$([regex]::Escape($nome))\s*$") {
        throw "Nome do adaptador Claude não coincide com a pasta: $nome"
    }
    $referencia = "../../../.agents/skills/$nome/SKILL.md"
    if ($conteudo -notmatch [regex]::Escape($referencia)) {
        throw "Adaptador Claude não aponta para a fonte canônica: $nome"
    }
    if ($conteudo.Length -gt 700) {
        throw "Adaptador Claude duplica instruções em vez de apenas apontar: $nome"
    }
    if ($nome -eq 'prototipar' -and $frontmatter -notmatch '(?m)^disable-model-invocation:\s*true\s*$') {
        throw 'Claude ainda permite invocação implícita de prototipar.'
    }
}

Write-Output 'Núcleo SDD validado: 11 skills canônicas e 11 comandos Claude.'
