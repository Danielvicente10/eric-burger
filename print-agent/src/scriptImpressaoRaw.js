// Script PowerShell que entrega os bytes do cupom ao spooler do Windows.
//
// Fica aqui como texto, e não como arquivo .ps1 separado, porque o agente
// roda na loja como .exe empacotado: só o JavaScript é embutido no
// executável, então um arquivo solto ao lado não existiria mais. Em tempo
// de execução ele é gravado numa pasta temporária e chamado.
//
// POR QUE PRECISA DISSO, e não algo mais simples:
//
//   - `print /D:"<impressora>"` (o que usávamos antes) é herdado do DOS e
//     espera PORTA ou compartilhamento de rede, não o nome amigável da
//     impressora. Com um nome comum ele retorna sucesso e não enfileira
//     nada. A falha é silenciosa: o agente dava "impresso e marcado", a
//     fila do Windows ficava vazia e o papel nunca saía.
//   - `Out-Printer` desenha o texto pelo GDI, o que destrói os comandos de
//     controle — o cupom sairia com os códigos ESC/POS como caracteres
//     soltos no meio do texto.
//
// Abrindo a impressora com pDataType = "RAW", o spooler repassa os bytes
// sem interpretar nada, que é o que a térmica espera.
//
// Cuidado ao editar: este texto é uma template string. Não use ${ } nem
// contrabarra, senão o JavaScript consome antes do PowerShell ver.

export const SCRIPT_IMPRESSAO_RAW = `
param(
  [Parameter(Mandatory = $true)] [string] $Impressora,
  [Parameter(Mandatory = $true)] [string] $Arquivo
)

$ErrorActionPreference = 'Stop'

Add-Type @'
using System;
using System.IO;
using System.Runtime.InteropServices;

public class ImpressoraRaw {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public class DOCINFO {
    [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
  }

  [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool OpenPrinter(string src, out IntPtr hPrinter, IntPtr pd);
  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool ClosePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFO di);
  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

  public static string Enviar(string impressora, string arquivo) {
    byte[] dados = File.ReadAllBytes(arquivo);
    IntPtr h;
    if (!OpenPrinter(impressora, out h, IntPtr.Zero))
      return "ERRO: nao consegui abrir a impressora [" + impressora + "] (codigo " + Marshal.GetLastWin32Error() + "). Confira se o nome no .env esta exatamente igual ao que aparece em Impressoras e scanners.";

    DOCINFO di = new DOCINFO();
    di.pDocName = "Cupom Eric Burger";
    di.pDataType = "RAW";

    if (!StartDocPrinter(h, 1, di)) {
      int e = Marshal.GetLastWin32Error(); ClosePrinter(h);
      return "ERRO: StartDocPrinter falhou (codigo " + e + ")";
    }
    if (!StartPagePrinter(h)) {
      int e = Marshal.GetLastWin32Error(); EndDocPrinter(h); ClosePrinter(h);
      return "ERRO: StartPagePrinter falhou (codigo " + e + ")";
    }

    IntPtr buffer = Marshal.AllocCoTaskMem(dados.Length);
    Marshal.Copy(dados, 0, buffer, dados.Length);
    int escritos = 0;
    bool ok = WritePrinter(h, buffer, dados.Length, out escritos);
    int erro = Marshal.GetLastWin32Error();
    Marshal.FreeCoTaskMem(buffer);

    EndPagePrinter(h);
    EndDocPrinter(h);
    ClosePrinter(h);

    if (!ok) return "ERRO: WritePrinter falhou (codigo " + erro + ")";
    if (escritos != dados.Length)
      return "ERRO: enviei " + escritos + " de " + dados.Length + " bytes";
    return "OK " + escritos;
  }
}
'@

$resultado = [ImpressoraRaw]::Enviar($Impressora, $Arquivo)

# Sair com codigo diferente de zero faz o agente NAO marcar o pedido como
# impresso, entao ele volta na proxima rodada. E o que queremos quando a
# impressora esta sem papel ou desligada: repetir um cupom e melhor do que
# perder um pedido.
if ($resultado -like 'OK *') {
  Write-Output $resultado
  exit 0
}

Write-Error $resultado
exit 1
`;
