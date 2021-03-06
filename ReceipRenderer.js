function ReceiptRenderEngine(){

    // debug receip
    // setTimeout(()=>Socket.createAPIRequest("DEBUG_RECEIPT"), 2000);
    // $(document).on(Orchid.EVENTS.APP_START, ()=>{
    //     Socket.createAPIRequest("DEBUG_RECEIPT");
    //     // Socket.createAPIRequest("REPRINT_TRANSACTION_RECEIPT", {
    //     //     id: "20200804170821_B65QNQVST450V",
    //     //     printerName: "Front Desk"
    //     // }).then(console.log);
    // });


    const FROM_MAIN_RECEIPT_RENDER_REQUEST = "FROM_MAIN_RECEIPT_RENDER_REQUEST";
    const FROM_RENDERER_REPLY_FROM_RECEIPT_RENDER_REQUEST = "FROM_RENDERER_REPLY_FROM_RECEIPT_RENDER_REQUEST";

    const C_WIDTH = 600;
    const C_MAX_HEIGHT = 4000;
    
    const HEADER_TEXT_SIZE = 34;
    const LINE_SPACE = 12;
    const SUB_HEADER_TEXT_SIZE = 30;
    const LINE_TEXT_SIZE = 26;
    const TOTAL_NUMBER_COLUMN_X = 400;

    let _options = {};
    let _origOptions = {
        fontSizeHeader: HEADER_TEXT_SIZE,
        lineSpace: LINE_SPACE,
        fontSizeSubHeader: SUB_HEADER_TEXT_SIZE,
        fontSizeRegular: LINE_TEXT_SIZE,
        numberColumnPosition: TOTAL_NUMBER_COLUMN_X,
        maxWidth: 512                                   // epson max width
    };


    let _canvas = document.createElement("canvas");
    let _imageBuffer = {};

    _canvas.width = C_WIDTH;
    _canvas.height = C_MAX_HEIGHT;

    let _$c = $(_canvas);
    let _cy = 0;
    let _tableLayouts = {};
    let _lastScaleFactor;


    this.initialize = ()=>{
        // const {ipcRenderer} = require("electron");
        // ipcRenderer.on(FROM_MAIN_RECEIPT_RENDER_REQUEST, (event, options) => {
        //      if (this.hasOwnProperty(options.command || null)) {
        //          let _start = _.now();

        //          // function to send payload back to caller in the back end context
        //          const sendReturnPayload = (payload) => {
        //              ipcRenderer.send(FROM_RENDERER_REPLY_FROM_RECEIPT_RENDER_REQUEST, {
        //                  requestId: options.requestId,
        //                  payload: payload
        //              });
        //          };

        //          // prepare return payload
        //          let returnPayload;
        //          if (typeof this[options.command] === 'function') {
        //              let fnc = this[options.command];
        //              returnPayload = fnc.apply(this, options.payload)
        //          }else {
        //             returnPayload = this[options.command];
        //          }

        //          // return the payload instantly if the payload is returnable,
        //          // if it is a promise, return it once it's ready
        //          if (returnPayload && typeof returnPayload.then === 'function') returnPayload.then(sendReturnPayload);
        //          else sendReturnPayload(returnPayload);

        //      }
        // });
    }

    //dev only
    this.showCanvas = () => {
        _$c.attr("class", "receipt-preview expanded");
        $('head').append(`<style type="text/css">
            canvas.expanded {width: 5in!important}
            canvas.receipt-preview {
                border: 1px solid black;
                width: 50px;
                background: rgba(255,255,255,.7);
                z-index: 9999999999;
                position: absolute;
                top: 0;
                right: 0;
                box-shadow: -19px 15px 22px -17px rgba(0,0,0,0.61);
            }
            </style>`);
        _$c.prependTo("body");
        _$c.on('click', function(){
            $(this).toggleClass('expanded');
        });

        window._c = _canvas;
    }

    this.TableLayouts = {
        SERVICE: 1,
        RETAIL: 2,
        TIP: 3,
        TOTAL: 4,
        TOTAL_BOLD: 5,
        REPORT_TECHNICIAN: 6,
        REPORT_RETAIL: 7,
        REPORT_SUMMARY: 8,
        REPORT_SUMMARY_BOLD: 9,
        REPORT_CASHIER_BALANCE: 10,
        RMS_RECEIPT_ITEM: 11,
        RMS_RECEIPT_ITEM_ADDON: 12,
        RMS_KITCHEN_RECEIPT_ITEM: 13,
        RMS_KITCHEN_RECEIPT_ITEM_ADDON: 14,
        RMS_KITCHEN_RECEIPT_HEADER: 15,
        RMS_REPORT_FOOD_SOLD: 16,
        RMS_KITCHEN_FOOD_CHECKLIST: 17,
        RMS_REPORT_TRANSACTION_LIST: 18
    };

    this.ScaleFactorsOf = {
        EPSON_80: 1,
        EPSON_58: 360/512,
        STAR_80: 560/512
    }

    this.clear = () => {
        _$c.clearCanvas();
        _cy = 0;
    }
    this.getFontSize = () => _options.fontSizeRegular;
    this.getMaxWidth = ()=> _options.maxWidth;
    this.setMaxWidth = width => {
        _options.maxWidth = width;
        this.initializeBasicTableLayouts();
    };

    this.setScaleFactor = (factor = 1) => {
        if (_lastScaleFactor === factor) return;

        for (let key in _origOptions) {
            let val = _origOptions[key];
            if (!isNaN(val)) _options[key] = Math.floor(val * factor);
        }

        _lastScaleFactor = factor;
        this.initializeBasicTableLayouts();
    }
    

    this.printHeader = text => {
        _$c.drawText({
            fillStyle: '#000',
            fontStyle: 'bold',
            fontSize: _options.fontSizeHeader,
            //fontFamily: 'Trebuchet MS, sans-serif',
            text: text,
            x: _options.maxWidth/2, y: _cy + _options.fontSizeHeader/2,
            maxWidth: _options.maxWidth
        });
        _cy += _options.fontSizeHeader + _options.lineSpace;
    }

    this.printSubHeader = text => {
        _$c.drawText({
            fillStyle: '#000',
            fontStyle: 'bold',
            fontSize: _options.fontSizeSubHeader,
            //fontFamily: 'Trebuchet MS, sans-serif',
            text: text,
            x: _options.maxWidth/2, y: _cy + _options.fontSizeSubHeader/2,
            maxWidth: _options.maxWidth
        });
        _cy += _options.fontSizeSubHeader + _options.lineSpace;
    }

    this.newLine = () => {
        _cy += _options.fontSizeRegular + _options.lineSpace;
    }

    this.printLineLeft = text => {
        _$c.drawText({
            fillStyle: '#000',
            fontStyle: 'bold',
            fontSize: _options.fontSizeRegular,
            //fontFamily: 'Trebuchet MS, sans-serif',
            text: text,
            align: 'left',
            respectAlign: true,
            x: 0, y: _cy + _options.fontSizeRegular/2,
            maxWidth: _options.maxWidth
        });
        _cy += _options.fontSizeRegular + _options.lineSpace;
    }

    this.printLine = (text, options) => {
        if (options && options.fontSize) options.fontSize = options.fontSize * _lastScaleFactor;
        options =  Object.assign({
            fillStyle: '#000',
            fontSize: _options.fontSizeRegular,
            text: text,
            align: 'left',
            respectAlign: true,
            x: 0, y: _cy + _options.fontSizeRegular/2,
            maxWidth: _options.maxWidth
        }, options);

        if (options.align === 'center') options.x = _options.maxWidth / 2;
        else if (options.align === 'right') options.x = _options.maxWidth;

        _$c.drawText(options);
        _cy += options.fontSize + _options.lineSpace;
    }

    this.printLineCenter = text => {
        _$c.drawText({
            fillStyle: '#000',
            fontStyle: 'bold',
            fontSize: _options.fontSizeRegular,
            //fontFamily: 'Trebuchet MS, sans-serif',
            text: text,
            align: 'center',
            // respectAlign: true,
            x: _options.maxWidth / 2, y: _cy + _options.fontSizeRegular/2,
            maxWidth: _options.maxWidth
        });
        _cy += _options.fontSizeRegular + _options.lineSpace;
    }

    this.printLeftRight = (l,r)=>{
        _$c.drawText({
            fillStyle: '#000',
            fontSize: _options.fontSizeRegular,
            //fontFamily: 'Trebuchet MS, sans-serif',
            text: l,
            align: 'left',
            respectAlign: true,
            x: 0, y: _cy + _options.fontSizeRegular/2,
            maxWidth: _options.maxWidth
        });
        _$c.drawText({
            fillStyle: '#000',
            fontSize: _options.fontSizeRegular,
            //fontFamily: 'Trebuchet MS, sans-serif',
            text: r,
            align: 'right',
            respectAlign: true,
            x: _options.maxWidth, y: _cy + _options.fontSizeRegular/2,
            maxWidth: _options.maxWidth
        });
        _cy += _options.fontSizeRegular + _options.lineSpace;
    }

    this.drawHorizontalLine = (isDashed, start = 0, length = _options.maxWidth) => {
        _$c.drawLine({
            strokeStyle: '#000',
            strokeWidth: 2,
            strokeDash: isDashed ? [5] : false,
            strokeDashOffset: 0,
            x1: start, y1: _cy,
            x2: length, y2: _cy,
        });
        _cy += _options.lineSpace;
    }

    this.setTable = (layoutId, colSettings) => {
        _tableLayouts[layoutId] = colSettings;
    }

    this.drawTableRow = (layoutId, ...texts) => {

        let maxLineHeight = 0;
        let drawTextOptions = {
            fillStyle: '#000',
            fontSize: _options.fontSizeRegular,
            text: "",
            align: 'left',
            respectAlign: true,
            x: 0, y: _cy + _options.fontSizeRegular/2,
            maxWidth: _options.maxWidth
        }

        let table = _tableLayouts[layoutId];
        if (!table) return false;

        let textIndex = 0;
        for (x in table) {
            let colText = texts[textIndex++];
            if (!colText) break;
            let colOption = table[x];
            let colTextOptions = Object.assign({}, drawTextOptions, colOption, {
                x: x,
                text: colText
            });
            if (colTextOptions.fontSize > maxLineHeight) maxLineHeight = colTextOptions.fontSize;
            colTextOptions.y = _cy + maxLineHeight/2;
            _$c.drawText(colTextOptions);
        }

        _cy += maxLineHeight + _options.lineSpace;
    }

    this.getNumberColumnX = ()=> _options.numberColumnPosition;

    this.getCanvas = () => _canvas;

    this.toBlob = async () => {
        return new Promise(resolve => {
            _canvas.toBlob(function(blob) {
                var r = new FileReader();
                r.onloadend = function () {
                    resolve(new Uint8Array(r.result));
                };
                r.readAsArrayBuffer(blob);
            }) ;
        });
    }

    this.getPixelArray = () => {
        let height = _cy + 1;
        let width = _options.maxWidth;

        let ctx = _canvas.getContext("2d");
        let imgData = ctx.getImageData(0,0, width, height).data;

        // Get pixel rgba in 2D array
        let pixels = [];
        for (let i = 0; i < height; i++) {
            let line = [];
            for (let j = 0; j < width; j++) {
                let idx = (width * i + j) << 2;
                line.push({
                    r: imgData[idx] ,
                    g: imgData[idx + 1] ,
                    b: imgData[idx + 2] ,
                    a: imgData[idx + 3]
                });


            }
            pixels.push(line);
        }

        return {
            pixels: pixels,
            width: width,
            height: height
        };
    }

    /**
     * load image to drawing
     * @param name
     * @param path
     * @returns {Promise<Pronmise>}
     */
    this.loadImage = async (name, path) => {
        return new Promise(resolve => {
            if (!_imageBuffer[name]) {
                let newImg = document.createElement("img");
                newImg.onload = function() {
                    _imageBuffer[name] = {
                        img: newImg,
                        width: newImg.naturalWidth,
                        height: newImg.naturalHeight
                    };
                    resolve(_imageBuffer[name]);
                };
                newImg.src = path;

            }else {
                resolve(_imageBuffer[name]);
            }
        });
    };

    this.debugMode = ()=>{
        this.showCanvas();
        //ThermalPrinter.Printer.execute = ()=>{};
    };

    /**
     * draw image
     */
    this.drawImage = async (img, options) => {
        let name = img.split('\\').pop().split('/').pop();
        let buffer = await this.loadImage(name, img);
        this.drawImageBuffer(buffer, options);
        return true;
    }

    /**
     * draw image
     * @param img
     */
    this.drawImageBuffer = (img, options) => {
        if (!img.img || !img.width || !img.height) throw("Invalid image buffer object");

        options = Object.assign({
            x: 0,
            y: _cy,
            fromCenter: false,
            source: img.img
        }, options);


        // if user did not specify the width and height of the drawing,
        // we check if the natural width of image is larger than the max width,
        // we adjust it
        if (!options.width && !options.height
            && img.width > _options.maxWidth) options.width = _options.maxWidth;

        // calculate the width and height (in scale)
        if (options.width) {
            options.scale = options.width / img.width;
            options.height = img.height * options.scale;
        }else if (options.height) {
            options.scale = options.height / img.height;
            options.width = img.width * options.scale;
        }else {
            options.width = img.width;
            options.height = img.height;
        }
        delete options.scale;

        _$c.drawImage(options);
        _cy += options.height;
    }

    /**
     * process the bundle of works at a whole and return the last request
     */
    this.processPipeline = function(works){
        _.each(works, work => {
            if (this.hasOwnProperty(work.command)) {
                this[work.command].apply(this, work.arguments);
            }
        });

        return this.getPixelArray();
    }

    /**
     * behind print paragraph
     * @param text
     * @param options
     * @private
     */
    function _doPrintParagraph(text, options) {
        let context = _canvas.getContext("2d");
        let words = text.split(' ');
        let line = '';
        if (options && options.fontSize) options.fontSize = options.fontSize * _lastScaleFactor;
        options = Object.assign({
            align: 'left',
            fontFamily: 'Trebuchet MS, sans-serif',
            x: 0
        }, options);

        if (options.align === 'center') options.x = _options.maxWidth / 2;
        else if (options.align === 'right') options.x = _options.maxWidth;

        //
        // trish to get measure correctly
        this.printLine("");             // print an empty line
        _cy -= _options.fontSizeRegular + _options.lineSpace;  // move cursor back to 1 line

        let maxWidth = _options.maxWidth;
        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = context.measureText(testLine);
            let testWidth = metrics.width;
            if (testWidth > maxWidth) {
                this.printLine(line, options);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        this.printLine(line, options);
    }

    this.printParagraph = (text, options)=>{
        _.each(text.split('\n'), p=>{
            _doPrintParagraph.call(this, p, options);
        });

    }

    this.initializeBasicTableLayouts = ()=> {
        // let's set some universal table
        const tblService = {};
        tblService[0] = {align: 'left', bold: false};
        tblService[40] = {align: 'left', fontStyle: 'bold'};
        tblService[_options.maxWidth] = {align: 'right', bold: false};
        this.setTable(this.TableLayouts.SERVICE, tblService);

        const tblServiceTip = {};
        tblServiceTip[40] = {align: 'left', bold: false, fontSize: 18};
        tblServiceTip[_options.maxWidth] = {align: 'right', bold: false};
        this.setTable(this.TableLayouts.TIP, tblServiceTip);

        const tblRetail = {};
        tblRetail[0] = {align: 'left', bold: false};
        tblRetail[40] = {align: 'left', fontStyle: 'bold'};
        tblRetail[_options.maxWidth] = {align: 'right', bold: false};
        this.setTable(this.TableLayouts.RETAIL, tblRetail);

        const tblTotalBold = {};
        tblTotalBold[_options.numberColumnPosition - 20] = {align: 'right', fontStyle: 'bold'};
        tblTotalBold[_options.maxWidth] = {align: 'right', fontStyle: 'bold'};
        this.setTable(this.TableLayouts.TOTAL_BOLD, tblTotalBold);


        const tblTotalLine = {};
        tblTotalLine[_options.numberColumnPosition - 20] = {align: 'right', fontStyle: 'normal'};
        tblTotalLine[_options.maxWidth] = {align: 'right', fontStyle: 'normal'};
        this.setTable(this.TableLayouts.TOTAL, tblTotalLine);

        //
        // prepare table layout for store reports
        //
        const tblReportTechnician = {};
        tblReportTechnician[0] = {align: 'left', fontStyle: 'bold'};                            // name 40%
        tblReportTechnician[Math.floor(_options.maxWidth * .55)] = {align: 'right', fontStyle: 'bold'};     // Volume 15%
        tblReportTechnician[Math.floor(_options.maxWidth * .70)] = {align: 'right', fontStyle: 'normal', fontSize: _options.fontSizeRegular * .85};   // Tip 15%
        tblReportTechnician[Math.floor(_options.maxWidth * .85)] = {align: 'right', fontStyle: 'normal', fontSize: _options.fontSizeRegular * .85};   // Supply 15%
        tblReportTechnician[_options.maxWidth] = {align: 'right', fontStyle: 'normal', fontSize: _options.fontSizeRegular * .85};         // Discount 15%
        this.setTable(this.TableLayouts.REPORT_TECHNICIAN, tblReportTechnician);

        const tblReportRetail = {};
        tblReportRetail[0] = {align: 'left', fontStyle: 'bold'};                                // name 40%
        tblReportRetail[Math.floor(_options.maxWidth * .75)] = {align: 'right'};                            // name 15%
        tblReportRetail[Math.floor(_options.maxWidth * .75) + 10] = {align: 'left'};                         // name seller 30%
        this.setTable(this.TableLayouts.REPORT_RETAIL, tblReportRetail);

        const tblReportSummary = {};
        // tblReportSummary[Math.floor(_options.maxWidth * .6)] = {align: 'right'};
        // tblReportSummary[Math.floor(_options.maxWidth * .80)] = {align: 'right', fontStyle: 'bold'};
        tblReportSummary[0] = {align: 'left'};
        tblReportSummary[Math.floor(_options.maxWidth * .70)] = {align: 'right'};
        this.setTable(this.TableLayouts.REPORT_SUMMARY, tblReportSummary);

        const tblReportSummaryBold = {};
        tblReportSummaryBold[0] = {align: 'left', fontStyle: 'bold'};
        tblReportSummaryBold[Math.floor(_options.maxWidth * .70)] = {align: 'right', fontStyle: 'bold'};
        this.setTable(this.TableLayouts.REPORT_SUMMARY_BOLD, tblReportSummaryBold);

        const tblReportCashierBalance = {};
        tblReportCashierBalance[0] = {align: 'left', fontStyle: 'bold'};
        tblReportCashierBalance[Math.floor(_options.maxWidth * .70)] = {align: 'right', fontStyle: 'bold'};
        tblReportCashierBalance[_options.maxWidth] = {align: 'right', fontStyle: 'bold'};
        this.setTable(this.TableLayouts.REPORT_CASHIER_BALANCE, tblReportCashierBalance);


        const tblRMSItem = {};
        tblRMSItem[0] = {align: 'left', fontSize: 48};
        tblRMSItem[_options.maxWidth] = {align: 'right', fontSize:24};
        this.setTable(this.TableLayouts.RMS_KITCHEN_RECEIPT_ITEM, tblRMSItem);

        const tblRMSItemAddon = {};
        tblRMSItemAddon[20] = {align: 'left', fontSize: 30};
        tblRMSItemAddon[_options.maxWidth] = {align: 'right', fontSize:30};
        this.setTable(this.TableLayouts.RMS_KITCHEN_RECEIPT_ITEM_ADDON, tblRMSItemAddon);

        const tblRMSKitchenHeaderTable = {};
        tblRMSKitchenHeaderTable[0] = {align: 'left', fontSize: 30};
        tblRMSKitchenHeaderTable[_options.maxWidth] = {align: 'right', fontSize:30};
        this.setTable(this.TableLayouts.RMS_KITCHEN_RECEIPT_HEADER, tblRMSKitchenHeaderTable);

        const tblReceiptItem = {};
        tblReceiptItem[35] = {align: 'right', fontStyle: 'bold'};
        tblReceiptItem[40] = {align: 'left', fontStyle: 'bold'};
        tblReceiptItem[_options.maxWidth] = {align: 'right', fontStyle: 'bold'};
        this.setTable(this.TableLayouts.RMS_RECEIPT_ITEM, tblReceiptItem);

        const tblReceiptItemAddon = {};
        tblReceiptItemAddon[40] = {align: 'left', fontStyle: 'normal', fontSize: 20};
        tblReceiptItemAddon[_options.maxWidth] = {align: 'right', bold: false, fontSize: 20};
        this.setTable(this.TableLayouts.RMS_RECEIPT_ITEM_ADDON, tblReceiptItemAddon);

        const tblReportFoodSold = {};
        tblReportFoodSold[40] = {align: 'right', fontStyle: 'normal', fontSize: 18};        // id
        tblReportFoodSold[45] = {align: 'left', fontStyle: 'normal', fontSize: 18};       // category name
        tblReportFoodSold[180] = {align: 'left', fontStyle: 'bold', fontSize: 18};       // item name
        tblReportFoodSold[_options.maxWidth] = {align: 'right', fontSize: 18};            // count
        this.setTable(this.TableLayouts.RMS_REPORT_FOOD_SOLD, tblReportFoodSold);

        const tblFoodItemChecklist = {};
        tblFoodItemChecklist[0] = {align: 'left', fontStyle: 'normal'};        // id
        tblFoodItemChecklist[40] = {align: 'left', fontStyle: 'normal'};       // itemName
        tblFoodItemChecklist[_options.maxWidth] = {align: 'right'};            // check box
        this.setTable(this.TableLayouts.RMS_KITCHEN_FOOD_CHECKLIST, tblFoodItemChecklist);

        const tblReportTransactionList = {};
        tblReportTransactionList[40] = {align: 'right', fontStyle: 'normal', fontSize: 18};        // id
        tblReportTransactionList[45] = {align: 'left', fontStyle: 'normal', fontSize: 18};       // server
        tblReportTransactionList[180] = {align: 'left', fontSize: 18, fontStyle: 'normal'};       // table
        tblReportTransactionList[_options.maxWidth - 80] = {align: 'right', fontSize: 18, fontStyle: 'normal'};       // tableName
        tblReportTransactionList[_options.maxWidth] = {align: 'right', fontSize: 18, fontStyle: 'bold'};            // total check
        this.setTable(this.TableLayouts.RMS_REPORT_TRANSACTION_LIST, tblReportTransactionList);

    };


    this.initialize();
    this.setScaleFactor(this.ScaleFactorsOf.EPSON_80);      // default
    //this.initializeBasicTableLayouts();
};
