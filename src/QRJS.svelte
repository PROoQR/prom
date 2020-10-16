<script>
  import "chota";
  import { onMount } from 'svelte';
  
  export let codeValue;
  export let squareSize; 
  
  let qrcode;
      
  onMount(() => {

    let script = document.createElement('script');
    script.src = "../js/qrcode.min.js"
    document.head.append(script);
  
    script.onload = function() {
      qrcode = new QRCode("qrcode", {
        text: codeValue,
        width: squareSize,
        height: squareSize,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.M
      });   
      
    };        
    
  });
</script>

<div id="qrcode" class="is-center"></div>