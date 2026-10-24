// Use the normal input path so linked fields and validation behave like typing.
document.querySelectorAll('[data-volume-target]').forEach(button=>{
  button.addEventListener('click',()=>{
    const field=document.getElementById(button.dataset.volumeTarget);
    if(!field||field.disabled||field.readOnly)return;
    field.value=button.dataset.volumeValue;
    field.dispatchEvent(new Event('input',{bubbles:true}));
    field.dispatchEvent(new Event('change',{bubbles:true}));
  });
});
