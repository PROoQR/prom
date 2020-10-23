<script>
  import "chota";
  import "pretty-checkbox";
  import { Button,Container,Input } from 'svelte-chota';
  import QRCode from "./QRJS.svelte"
  let questions = prom.questions;
  let sections = prom.sections;
  let asks = {};
  let showQR = false;
  let pro = '';
  let msg = '';
  
  let txt_required = 'Some not answered, please check!'
  let txt_submit = 'Submit';
  let txt_copy = 'Copy to Clipboard';
  let txt_download = 'Download as JSON file';
  let txt_redo = 'Hide & Redo';
  let txt_to_scan = 'Please ask your doctor to scan and interpret, or take a screenshot for the next visit.';
  let txt_disclaimer = 'DISCLAIMER: For security and privacy concern, your data will not be uploaded onto any server and it is only submitted into a QR code on your device.';
  switch(prom.lang) {
    case 'zh-CN':
      txt_required = '有问题未回答，请检查！';
      txt_submit = '提交';
      txt_copy = '复制到剪贴板';
      txt_download = '下载JSON文件';
      txt_redo = '重填';
      txt_to_scan = '请在医生电脑旁扫码二维码，或者截屏下次再扫';
      txt_disclaimer = '声明：为了安全和隐私保护，数据不会保存在互联网上；而是压缩进了二维码，请确保仅出示给医生看！';
      
      break;
  } 

  const urlParams = new URLSearchParams(window.location.search);
  const json = urlParams.get('json');  
  for (var i = 0; i < questions.length; i++) {
    const q = questions[i];
    asks[q.code] = '';
  }
  function submit() {
    let count = 0;
    pro = prom.code+':'+prom.lang+':'+prom.ver;
    const codes = Object.keys(asks);
    for (var i = 0; i < codes.length; i++) {
      const c = codes[i];
      if (asks[c]) {
        pro += '/' + c + ':' + asks[c];
        count++;
      }
    }
    if (count == questions.length) {
      showQR = true;
    } else {
      msg = txt_required;
    }
  }
  function redo() {
    showQR = false;
    msg = '';
  } 
  function copy() {
    navigator.clipboard.writeText(JSON.stringify(prom, null, 2)).then(function() {
      console.log('Async: Copying to clipboard was successful!');
    }, function(err) {
      console.error('Async: Could not copy text: ', err);
    });
  } 

  function download() {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(prom, null, 2)));
    element.setAttribute('download', prom.code+'.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  } 
</script>
<style>
  .block {
    margin: 15px 0;
    display: block;
  }
  .bottom {
    margin-bottom: 60px;
    display: block;
  }
  .intro {
    margin: 0 5px;
  }
</style>

<Container>
{#if json }
  <br/>
  <Button primary on:click={copy}>{txt_copy}</Button>
  <Button secondary on:click={download}>{txt_download}</Button>
  <pre>
    {JSON.stringify(prom, null, 2)}
  </pre>
{:else}
  <h3 class="text-center">{prom.name}</h3>
  <p>{prom.intro}</p>
  

  {#each sections as s}
    {#if s.intro }
      <div class="bg-dark text-white"><div class="intro">{s.intro}</div></div>
    {/if}
    {#each questions as q}
      {#if q.code.substr(0,2) == s.code }        
        <h5>{q.name}</h5>
        {#each q.answers as a}
          {#if q.type == 'checkbox'}
            <div class="pretty p-default p-curve p-thick block">
              <input type="checkbox" bind:group={asks[q.code]} value={a.code} />
              <div class="state p-success block">
                <label>{a.name}</label>
              </div>
            </div>
          {/if}
          {#if q.type == 'radio'}
            <div class="pretty p-default p-round block">
              <input type="radio" bind:group={asks[q.code]} value={a.code} />
              <div class="state p-primary block">
                <label>{a.name}</label>
              </div>
            </div>
          {/if}
        {/each}
        <hr/>
      {/if}
    {/each}
  {/each}
  <br>
  {#if showQR }
    <p class="text-center">
      <span>{prom.name}</span>
    </p>
    
    <QRCode codeValue={pro} squareSize=250/>
    <div class="text-grey text-center block">
      <small>{txt_to_scan}</small>      
    </div>
    <div class="bottom">
    <Button outline secondary on:click={redo} class="is-full-width">{txt_redo}</Button>
    </div>
  {:else}
    {#if msg }
      <div class="text-error">{msg}</div>
    {/if}
 
    <p>{txt_disclaimer}</p>
    <div class="bottom">
      <Button primary on:click={submit} class="is-full-width">{txt_submit}</Button>
    </div>
  {/if}
  <br>
  <br>  
{/if}

</Container>