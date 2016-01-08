

var MostrarMenu=Ext.extend(gxp.plugins.Tool,{
	
	ptype:"app_mostrarmenu",
	
	featureManager:null,
	
	autoHide:!1,
	
	schema:null,
	
	outputAction:0,
	
	autoExpand:null,
	
	outputTarget: "lugaresCercanos",
	
	hidden: true,


	addOutput:function(a){
			
					
	MostrarMenu.superclass.addOutput.call(this,a)},
		
	removeOutput:function(){
			
					
	MostrarMenu.superclass.removeOutput.call(this)}	
		
		});


Ext.preg(MostrarMenu.prototype.ptype,MostrarMenu);