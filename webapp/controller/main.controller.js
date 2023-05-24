sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    'sap/m/SearchField',
    'sap/ui/model/type/String',
    'sap/ui/table/Column',
    'sap/m/Table',
    "sap/ui/core/Fragment",
    'sap/m/MessageBox',
    'sap/ui/model/Sorter'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Filter, FilterOperator, SearchField, TypeString, UIColumn, mTable, Fragment, MessageBox, Sorter) {
        "use strict";

        return Controller.extend("mdcomparativeanalysis.controller.main", {
            onInit: function () {

                let appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                let appPath = appId.replaceAll(".", "/");
                this.appModulePath = jQuery.sap.getModulePath(appPath);
                var nfaModel = new JSONModel();
                this.getView().setModel(nfaModel, "nfaModel");
                // this.nfaData = {
                // };

                // this.readNFAData("7000000026", "Doc652480915");
            },

            readNFAData: function (rfqNumber, eventId) {

                var data = {
                    "rfqNumber": rfqNumber,
                    "eventId": eventId,
                }
                // var token = this.fetchToken();
                var settings = {
                    async: true,
                    url: this.appModulePath + "/comparative-analysis/getcpcNfaDetails",
                    method: "POST",
                    headers: {
                        "content-type": "application/json"
                    },
                    processData: false,
                    data: JSON.stringify(data)
                };
                // this.getView().setBusy(true);
                $.ajax(settings)
                    .done(function (response) {
                        this.getView().getModel("nfaModel").setProperty("/", response.value[0]);
                        this.showNFAPackWisePrice(response.value[0].cpcNFAPackWisePriceDetails);
                        this.showNFAPricingTable(response.value[0].cpcNFAPackWisePriceDetails);
                    }.bind(this)).fail(function () {

                    });

                let urlFilter = "?$filter=Ebeln_Ebeln eq '" + rfqNumber + "'" + " and internalId eq '" + eventId + "'";
                $.get({
                    url: this.appModulePath + "/comparative-analysis/RFQEvents" + urlFilter, //"./comparative-analysis/RFQEventCompDetails",
                    success: function (resp) {
                        this.nfaEventTitle = resp.value[0].title;

                    }.bind(this),
                    error: function (error) {
                        console.log(error);
                    }
                });

            },

            // #region Value Help Dialog standard use case with filter bar without filter suggestions
            onValueHelpRequested: function () {
                this._oBasicSearchField = new SearchField();
                if (!this.pDialog) {
                    this.pDialog = this.loadFragment({
                        name: "mdcomparativeanalysis.view.RFQValueHelp"
                    });
                }
                var rfqNumber =
                    this.pDialog.then(function (oDialog) {
                        var oFilterBar = oDialog.getFilterBar();
                        this._oVHD = oDialog;
                        // Initialise the dialog with model only the first time. Then only open it
                        if (this._bDialogInitialized) {
                            // Re-set the tokens from the input and update the table
                            oDialog.setTokens([]);
                            //oDialog.setTokens(this.getView().byId("RFQEventFilterValueHelp").getTokens());
                            oDialog.update();

                            oDialog.open();
                            return;
                        }
                        this.getView().addDependent(oDialog);

                        // Set key fields for filtering in the Define Conditions Tab
                        oDialog.setRangeKeyFields([{
                            label: "Internal ID",
                            key: "internalId",
                            type: "string",
                            typeInstance: new TypeString({}, {
                                maxLength: 7
                            })
                        }]);

                        // Set Basic Search for FilterBar
                        oFilterBar.setFilterBarExpanded(false);
                        oFilterBar.setBasicSearch(this._oBasicSearchField);

                        // Trigger filter bar search when the basic search is fired
                        this._oBasicSearchField.attachSearch(function () {
                            oFilterBar.search();
                        });

                        oDialog.getTableAsync().then(function (oTable) {

                            //oTable.setModel(this.oProductsModel);
                            let aFilters = [];
                            aFilters.push(new Filter({
                                filters: [
                                    new Filter({ path: "Ebeln/Department", operator: 'EQ', value1: "Market Development" }),
                                    new Filter({ path: "status", operator: 'EQ', value1: "Pending Selection" }),
                                ],
                                and: true
                            }));
                            // For Desktop and tabled the default table is sap.ui.table.Table
                            if (oTable.bindRows) {
                                // Bind rows to the ODataModel and add columns
                                oTable.bindAggregation("rows", {
                                    path: "/RFQEvents",
                                    filters: aFilters,
                                    events: {
                                        dataReceived: function () {
                                            oDialog.update();
                                        }
                                    }
                                });
                                oTable.addColumn(new UIColumn({ label: "RFQ", template: "Ebeln_Ebeln" }));
                                oTable.addColumn(new UIColumn({ label: "Internal Id", template: "internalId" }));
                                oTable.addColumn(new UIColumn({ label: "Title", template: "title" }));

                            }

                            // For Mobile the default table is sap.m.Table
                            if (oTable.bindItems) {
                                // Bind items to the ODataModel and add columns
                                oTable.bindAggregation("items", {
                                    path: "/RFQEvents",
                                    template: new ColumnListItem({
                                        cells: [new Label({ text: "{Ebeln_Ebeln}" }), new Label({ text: "{internalId}" }), new Label({ text: "{title}" })]
                                    }),
                                    events: {
                                        dataReceived: function () {
                                            oDialog.update();
                                        }
                                    }
                                });
                                oTable.addColumn(new MColumn({ header: new Label({ text: "RFQ" }) }));
                                oTable.addColumn(new MColumn({ header: new Label({ text: "Internal ID" }) }));
                                oTable.addColumn(new MColumn({ header: new Label({ text: "Title" }) }));
                            }
                            oDialog.update();
                        }.bind(this));

                        //oDialog.setTokens(this._oMultiInput.getTokens());

                        // set flag that the dialog is initialized
                        this._bDialogInitialized = true;
                        oDialog.open();
                    }.bind(this));
            },

            onRFQSelection: function () {
                this.getView().byId("RFQEventFilter").setVisible(true);
            },

            onValueHelpOkPress: function (oEvent) {
                var aTokens = oEvent.getParameter("tokens");
                this.getView().byId("RFQEventFilterValueHelp").setTokens(aTokens);
                this._oVHD.close();
            },

            onValueHelpCancelPress: function () {
                this._oVHD.close();
            },



            onSuggestionItemSelected: function (oEvent) {
                var oItem = oEvent.getParameter("selectedItem");
                var oText = oItem ? oItem.getKey() : "";
                this.byId("selectedKeyIndicator").setText(oText);

            },

            // Function triggers after change of filters
            onItemsFiltered: function (oEvent) {
                let selectedEvents = this.getView().byId("RFQEventFilterValueHelp").getTokens();
                this.selectedEvents = [];
                //let rfqNumber = this.getView().byId("rfqInput").getValue();
                let filters = "?$filter=";
                for (let i = 0; i < selectedEvents.length; i++) {
                    filters = i ? filters + " or eventID eq '" + selectedEvents[i].getKey() + "'" : filters + "eventID eq '" + selectedEvents[i].getKey() + "'";
                    this.selectedEvents.push(selectedEvents[i].getKey());
                }
                var url = this.appModulePath + "/comparative-analysis/mdRFQEventItems" + filters;

                //Filters to be passed based on the selectedEvents
                $.get({
                    url: url, //"./comparative-analysis/RFQEventCompDetails",
                    success: function (resp) {
                        if (resp.value.length > 0) {
                            this.showComparativeTable(resp.value);
                            this.comparaiveTableData = resp.value;
                        }

                    }.bind(this),
                    error: function (error) {
                        console.log(error);
                    }
                });

                var nfaModel = new JSONModel();
                this.getView().setModel(nfaModel, "nfaModel");
                // this.nfaData = {
                // };
                this.nfaEvent = this.selectedEvents.slice(-1)[0];
                //this.readNFAData(rfqNumber, this.nfaEvent);

            },

            showComparativeTable: function (mdData) {
                var mdColumns = [], uniquSKUs = [];
                var productData = {}, finalData = [];
                //Get Column list
                for (var item of mdData) {
                    if (!mdColumns.filter(function (obj) { return item.vendorName == obj.columnName }).length) {
                        mdColumns.push({ columnName: item.vendorName });
                    }
                    if (!uniquSKUs.includes(item.itemTitle)) {
                        uniquSKUs.push(item.itemTitle);
                    }
                }

                mdColumns.unshift({ columnName: "Item Description" });
                mdColumns.push({ columnName: "item" });


                var costFields = [
                    { id: "Price", name: "Rate (Rs)" },
                    { id: "gstExtra", name: "Extra GST" },
                    // { id: "remark", name: "Remark" }
                    { id: "other", name: "Other Charges" },
                    { id: "comments", name: "Comments" }
                ];
                for (var i in uniquSKUs) {
                    

                    for (let event of this.selectedEvents) {
                        let filteredData = mdData.filter(function (item) {
                            return item.itemTitle == uniquSKUs[i] && item.eventID == event;
                        });
                        for (var j in costFields) {
                            productData = {};
                            productData["item"] = uniquSKUs[i] + " (" + event + ")";
                            //productData.vendorId = filteredData[0].vendorId;
                            productData.eventID = filteredData[0].eventID;
                            productData["Item Description"] = costFields[j].name;
                            for (let obj of filteredData) {
                                // nfaPackObj.Vendor = obj.vendorName;
                                if (costFields[j].id === "other" || costFields[j].id === "comments") {
                                    productData[obj.vendorName] = "";
                                    productData.editable = true;
                                } else {
                                    productData[obj.vendorName] = productData[obj.vendorName] ? parseFloat(productData[obj.vendorName]) + parseFloat(obj[costFields[j].id]) : obj[costFields[j].id];
                                    productData.editable = false;
                                }
                            }
                            finalData.push(productData);
                        }
                    }
                }
                console.log(finalData);
                this.generateComparativeTable(finalData, mdColumns);
            },

            generateComparativeTable: function (finalData, uniqueColumnData) {
                //this.nfaPackWisePrice = finalData;
                // Create a Table for ComparativeAnalysis
                var oTable = this.getView().byId("compartiveTable");
                // var template;

                // var finalModel = new sap.ui.model.json.JSONModel();
                // this.getView().setModel(finalModel, "finalModel");
                // finalModel.setData({
                //     rows: finalData,
                //     columns: uniqueColumnData
                // });

                // oTable.setModel(finalModel);
                // oTable.setVisibleRowCount(finalData.length);
                // oTable.bindColumns("/columns", function (sId, oContext) {
                //     var columnName = oContext.getObject().columnName;

                //     template = new sap.m.Label({
                //         text: "{" + columnName + "}",
                //         wrapping: true
                //     });
                //     var column;
                //     if (columnName == "item") {
                //         column = new sap.ui.table.AnalyticalColumn({
                //             label: new sap.m.Label({
                //                 text: columnName,
                //                 wrapping: true
                //             }),
                //             template: template,
                //             grouped: true
                //         });
                //     } else {
                //         column = new sap.ui.table.AnalyticalColumn({
                //             label: new sap.m.Label({
                //                 text: columnName,
                //                 wrapping: true
                //             }),
                //             template: template
                //         });
                //     }
                //     return column;
                // });

                // oTable.bindRows("/rows");
                // oTable.setEnableGrouping(true);
                //oTable.bindItems("nfaPricingTable>/", aColList);

                // Create a Table for ComparativeAnalysis
                //var oTable = this.getView().byId("comparativeTable");
                oTable.destroyColumns();
                var columnName;
                for (var j = 0; j < uniqueColumnData.length; j++) {
                    var oColumn = new sap.m.Column({

                        header: new sap.m.Label({
                            text: uniqueColumnData[j].columnName,
                            wrapping: true
                        })
                    });
                    oTable.addColumn(oColumn);
                };

                var oCell = [];
                var text;
                var that = this;
                for (let i = 0; i < uniqueColumnData.length; i++) {

                    text = uniqueColumnData[i].columnName;

                    var cell1;
                    if (text == "Item Description") {
                        cell1 = new sap.m.Text({
                            text: "{" + text + "}"
                        });
                    } else {
                        cell1 = new sap.m.Input({
                            value: "{" + text + "}",
                            editable: "{editable}"
                        });
                    }
                    oCell.push(cell1);
                }
                var aColList = new sap.m.ColumnListItem({
                    cells: oCell
                });
                var jsonModel = new JSONModel(finalData);
                // console.log(data);
                oTable.setModel(jsonModel);
                oTable.bindItems("/", aColList);

                let aGroups = [];
                var vGroup = function (oContext) {
                    var name = oContext.getProperty("item");
                    return {
                        key: name,
                        text: name
                    };
                };
                aGroups.push(new Sorter("item", false, vGroup));
                oTable.getBinding("items").sort(aGroups);
                let columnLength = oTable.getColumns().length;
                oTable.getColumns()[columnLength - 1].setVisible(false);
            },

            cellFormatter: function (sName) {
                return sName;
            },

            handleNFASave: function () {
                var sData = this.getView().getModel("nfaModel").getProperty("/");
                var finalData = JSON.parse(JSON.stringify(sData));
                // Collect SKU with MRP Data
                let packWiseTableRows = this.getView().byId("nfaPackWiseTable").getRows();
                let objSKUMRPDetails = {}, arrSKUMRPDetails = [];
                for (let item of packWiseTableRows) {
                    objSKUMRPDetails = {};
                    objSKUMRPDetails.SKUName = item.getCells()[0].getText();
                    objSKUMRPDetails.eventID = this.nfaEvent;
                    objSKUMRPDetails.Ebeln = "7000000026"; //this.rfqNumber;
                    objSKUMRPDetails.MRP = item.getCells()[5].getValue();
                    arrSKUMRPDetails.push(objSKUMRPDetails);
                }
                finalData.cpcSkuMRPDetais = arrSKUMRPDetails;

                var settings = {
                    async: false,
                    url: this.appModulePath + "/comparative-analysis/cpcNFADetails",
                    method: "POST",
                    headers: {
                        "content-type": "application/json"
                        // "X-CSRF-Token": token
                    },
                    processData: false,
                    data: JSON.stringify(finalData)
                };
                this.getView().setBusy(true);
                $.ajax(settings)
                    .done(function (response) {
                        this.getView().setBusy(false);
                        MessageBox.success("Data Saved Successfully");
                    }.bind(this)
                    )
                    .fail(function (error) {
                        this.getView().setBusy(false);
                        var errorMessage = error.responseJSON.error.message;
                        if (errorMessage.startsWith("Reference integrity is violated for association")) {
                            var associatedField = error.responseJSON.error.target.split(".")[1].toLowerCase();
                            MessageBox.error("Invalid value for field : " + associatedField);
                            throw new Error("");
                        } else if (errorMessage.startsWith("Entity already exists")) {
                            MessageBox.error("Entity already exists");
                            throw new Error("");
                        }
                        else {
                            MessageBox.error(error.responseText);
                            return;
                        }
                    }.bind(this));
            },

            //Event will be triggered on icon tab bar selection change
            // onITBSelectionChange: function (oEvent) {
            //     let key = oEvent.getSource().getSelectedKey();
            //     if (key == "nfatemplate") {
            //         let rfqNumber = "7000000026"; //Temp -should be deleted.
            //         //let rfqNumber = this.getView().byId("rfqInput").getValue();
            //         let nfaData = this.getView().getModel("nfaModel").getProperty("/");
            //         if (Object.keys(nfaData).length === 0 && nfaData.constructor === Object) {
            //             this.readNFAData(rfqNumber, this.nfaEvent);
            //         }
            //         this.getView().byId("subject").setValue(this.nfaEventTitle);
            //         this.getView().byId("printPDF").setVisible(true);
            //         this.getView().byId("page").setShowFooter(true);
            //     } else {
            //         this.getView().byId("printPDF").setVisible(false);
            //         this.getView().byId("page").setShowFooter(false);
            //     }
            // }
        });
    });

