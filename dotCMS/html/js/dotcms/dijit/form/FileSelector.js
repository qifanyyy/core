 /**
 *  
 * This is a form dijit that renders a text field for the user to be able to select a file from the dotCMS tree and assign it to a form field.
 * 
 * This dijit uses the FileBrowserDialog.js in order to present a browser for the user to search the file to attach to the form field.
 * 
 * It generates a hidden field with the identifier of the selected file that it could be submitted with your form.
 * 
 * 
 * To include the dijit into your page
 * 
 * JS Side
 * 
 * <script type="text/javascript">
 * 	dojo.require("dotcms.dijit.form.FileSelector");
 * 
 * ...
 * 
 * </script>
 * 
 * HTML side
 * 
 * <div id="myDijitId" jsId="myJSVariable" style="cssStyleOptions" name="myNameWithinTheForm" 
 * 	onlySelectFolders="true" value="file/page/link identifier" dojoType="dotcms.dijit.form.FileSelector"></div>
 * 
 * Properties
 * 
 * id: non-required - this is the id of the widget if not specified then it will be autogenerated.
 * 
 * jsId: non-required - if specified then dijit will be registered in the JS global enviroment with this name.
 * 
 * name: non-required - Need to be specified if you want the selected folder/host id to be submitted with your form.
 * 
 * showThumbnail: non-required - default false - If true it will detect if the selected file is an image an present and thumbnail of it.
 * 
 * value: The identifier of the selected file/page/link.
 * 
 * style: non-required - modifies the html css styles of the combo box.
 * 
 * mimeTypes: non-required - A comma separated list of mime types to filter for, mime types specified not need to match the whole name, 
 * 		I.E. if "image" is specified as mime type it will match files with mime types like "image/jpeg" or "image/png".
 * 
 * fileExtenstions: non-required - A comma separated list of file extensions to filter for. E.G. "jpg,png,gif".
 * 
 * showInfo - non-required - default true - displays a button to show more info of the selected file.
 * 
 * fileBrowserView: non-required - default details - The widget has three different views details, list, thumbnails when selecting a file.
 * 
 * onlyFiles: non-required - default false - If true only shows files and filters out pages and links.
 * 
 * 
 * Programmatically
 *  
 * How to retrieve values from the dijit
 * 
 * To retrieve the selected folder/host id 
 * dijit.byId('myDijitId').attr('value') // Will return something like '6fa459ea-ee8a-3ca4-894e-db77e160355e'
 * 
 * To retrieved the selected asset
 * dijit.byId('myDijitId').attr('fileInfo')  // Will return a file object with all the info of the selected file
 * 
 * 
 */

dojo.provide("dotcms.dijit.form.FileSelector");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit.form.VerticalSlider");
dojo.require("dijit.form.VerticalRule");
dojo.require("dijit.form.Button");
dojo.require("dotcms.dijit.FileBrowserDialog");


dojo.declare("dotcms.dijit.form.FileSelector", [dijit._Widget, dijit._Templated], {
	
	templatePath: dojo.moduleUrl("dotcms", "dijit/form/FileSelector.jsp"),
	fileInfoTemplate: '<div>\
			<table class="listingTable">\
				<tr class="alternate_1">\
		    		<td><b>File Name</b></td>\
					<td>{fileName}</td>\
				</tr>\
				<tr class="alternate_2">\
		    		<td><b>Id</td>\
					<td>{identifier}</td>\
				</tr>\
				<tr class="alternate_1">\
		    		<td><b>Title</b></td>\
					<td>{title}</td>\
				</tr>\
				<tr class="alternate_2">\
		    		<td><b>File Link</b></td>\
					<td><a target="_blank" href="{path}{fileName}">{path}{fileName}</a></td>\
				</tr>\
			</table>\
		</div>',
	pageInfoTemplate: '\
			<table class="listingTable">\
				<tr class="alternate_1">\
		    		<td><b>Page</td>\
					<td>{pageUrl}</td>\
				</tr>\
				<tr class="alternate_2">\
		    		<td><b>Id</b></td>\
					<td>{identifier}</td>\
				</tr>\
				<tr class="alternate_1">\
		    		<td><b>Title</b></td>\
					<td>{title}</td>\
				</tr>\
				<tr class="alternate_2">\
		    		<td><b>Show on menu</b></td>\
					<td>{showOnMenu}</td>\
				</tr>\
				<tr class="alternate_1">\
		    		<td><b>Friendly Name</b></td>\
					<td>{friendlyName}</td>\
				</tr>\
				<tr class="alternate_2">\
		    		<td><b>Page Link</b></td>\
					<td><a target="_blank" href="{pageURI}">{pageURI}</a></td>\
				</tr>\
			</table>\
		',
	widgetsInTemplate: true,
	
	style: "",
	showThumbnail: false,
	defaultThumbnailSize: 250,	
	thumbnailSize: 250,
	mimeTypes: new Array(),
	fileExtensions: new Array(),
	name: '',
	value: '',
	fileInfo: null,
	showInfo: true,
	fileBrowserView: 'details',
	onlyFiles: false,
	allowFileUpload: true,
	
	postCreate: function () {
		
		if(this.value != '') {
			BrowserAjax.getFileInfo(this.value, dojo.hitch(this, this._setFile));
			dojo.style(this.removeFileButton.domNode, { display: '' });
		}
		
		dojo.connect(this.thumbnailSizeSlider, 'onChange', dojo.hitch(this, this._changeThumbnailSize));
		this.fileBrowser.onFileSelected = dojo.hitch(this, this._browserFileSelected);
		this.fileBrowser.fileExtensions = this.fileExtensions;
		this.fileBrowser.mimeTypes = this.mimeTypes;
		this.fileBrowser.onlyFiles = this.onlyFiles;
		this.fileBrowser.currentView = this.fileBrowserView;
		this.fileBrowser.allowFileUpload = this.allowFileUpload;
		
	},
	
	_setFile: function (fileInfo) {

		if(!fileInfo) {
			this._removeClicked();
			return;
		}
			
		this.fileInfo = fileInfo;
		if(this.showThumbnail && fileInfo.mimeType.indexOf('image') >= 0) {
			var thumbSize; 
			try {
				thumbSize = parseInt(dojo.cookie(this.id + '-thumbsize'));
			} catch (e) { }
			if(!thumbSize) {
				dojo.cookie(this.id + '-thumbsize', this.defaultThumbnailSize);
				this.thumbnailSize = this.defaultThumbnailSize;
			} else {
				this.thumbnailSize = thumbSize;
			}

			if(fileInfo.mimeType.indexOf('image/svg') <0 && fileInfo.mimeType.indexOf('image/x-icon')<0) {
				this.thumbnailImage.src = "/contentAsset/image/" + fileInfo.identifier + "/fileAsset/filter/Thumbnail/thumbnail_w/" + this.thumbnailSize + "/rand/" + Math.random();
			}else{
				this.thumbnailImage.src = '/contentAsset/image/' + fileInfo.identifier + '/fileAsset/'+fileInfo.inode;
			}

			this.thumbnailSizeSlider.attr('value', this.thumbnailSize);
	        dojo.style(this.thumbnailWrapper, { display : "" });		
		} else {
	        dojo.style(this.thumbnailWrapper, { display : "none" });		
		}
		this.value = fileInfo.identifier;
		if(fileInfo.type == 'htmlpage')
			this.labelTextField.set('value',fileInfo.pageUrl);
		else
			this.labelTextField.set('value',fileInfo.fileName);
		this.valueTextField.value = fileInfo.identifier;

		if(this.showInfo) {
	        dojo.style(this.removeFileButton.domNode, { display : "" });		
		}
		
	    dojo.style(this.infoFileButton.domNode, { display : "" });		
	},
	
	uninitialize : function (event) {
	},
	
	/**
	 * Stub method that you can use dojo.connect to catch every time a user selects a file
	 * @param {Object} file
	 */
	onFileSelected: function (file) {
		
	},
	
	_browserFileSelected: function (file) {
		this._setFile(file);
		this.onFileSelected(file);
	},
	
	_changeThumbnailSize: function (newValue) {
		this.thumbnailSize = newValue;
	    this.thumbnailImage.src = "/contentAsset/image/" + this.value + "/fileAsset/filter/Thumbnail/thumbnail_w/" + newValue + "/rand/" + Math.random();
		dojo.cookie(this.id + '-thumbsize', new String(newValue));
	},
	
	_browseClicked: function () {
		this.fileBrowser.show();
	},
	
	_removeClicked: function () {
		dojo.style(this.removeFileButton.domNode, { display: 'none' });
		dojo.style(this.thumbnailWrapper, { display: 'none' });
		dojo.style(this.infoFileButton.domNode, { display: 'none' });
		this.value = '';
		this.fileInfo = null;
		this.labelTextField.set('value','');
		this.valueTextField.value = '';
	},
	
	_infoClicked : function () {
		if(this.fileInfo.type == 'file_asset') {
			var fileURL = '/contentAsset/raw-data/' + this.fileInfo.identifier + '/fileAsset';
			var fullPath = this.fileInfo.path + this.fileInfo.fileName;
			var fileName = this.fileInfo.fileName;
			var html = dojo.replace(this.fileInfoTemplate, this.fileInfo);
		}
		if (this.fileInfo.type == 'htmlpage') {
			var fileURL = this.fileInfo.pageURI;
			var fullPath = this.fileInfo.pageURI;
			var fileName = this.fileInfo.name;
			var html = dojo.replace(this.pageInfoTemplate, this.fileInfo);
		}
		if (this.fileInfo.type == 'contentlet') {
			var fileURL = '/contentAsset/raw-data/' + this.fileInfo.identifier + '/fileAsset';
			var fullPath = this.fileInfo.path + this.fileInfo.fileName;
			var fileName = this.fileInfo.fileName;
			var html = dojo.replace(this.fileInfoTemplate, this.fileInfo);
		}
		this.fileInfoDialog.title = fileName;
		var domObj = dojo._toDom(html);
		this.fileInfoDialog.setContent(domObj);
		this.fileInfoDialog.show();
	}

})