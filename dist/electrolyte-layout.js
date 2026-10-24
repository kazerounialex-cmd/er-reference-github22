// Presentation only: update in place on wide screens; reveal results on narrow screens.
const ReferenceLayout={
  reveal(destinationId,mathId){
    const destination=document.getElementById(destinationId);
    const desktop=window.matchMedia('(min-width: 1160px)').matches;
    // Math stays user-controlled; selecting a dose never expands it automatically.
    if(desktop)return;
    const position=destination.getBoundingClientRect();
    if(position.top<110 || position.bottom>window.innerHeight){
      destination.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    }
    destination.focus({preventScroll:true});
  }
};
if(typeof module!=='undefined')module.exports=ReferenceLayout;
