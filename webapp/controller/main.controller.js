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
                // var nfaModel = new JSONModel();
                // this.getView().setModel(nfaModel, "nfaModel");
                // this.nfaData = {
                // };

                // this.readNFAData("7000000026", "Doc652480915");
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
                                    new Filter({ path: "Ebeln_Ebeln", operator: 'EQ', value1: this.getView().byId("rfqInput").getSelectedKey() }),
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

            // Value Help Request for the RFQ List
            onRFQValueHelpRequest: function (oEvent) {
                var sInputValue = oEvent.getSource().getValue(),
                    oView = this.getView();

                if (!this._pValueHelpDialog) {
                    this._pValueHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "mdcomparativeanalysis.view.RFQListValueHelp",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }
                this._pValueHelpDialog.then(function (oDialog) {
                    // Create a filter for the binding
                    oDialog.getBinding("items").filter([new Filter("Department", FilterOperator.Contains, "Market Development")]);
                    // Open ValueHelpDialog filtered by the input's value
                    oDialog.open(sInputValue);
                });
            },

            onRFQValueHelpDialogSearch: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                var oFilter = new Filter("Ebeln", FilterOperator.Contains, sValue);

                oEvent.getSource().getBinding("items").filter([oFilter]);
            },
            onRFQValueHelpDialogClose: function (oEvent) {
                var sDescription,
                    oSelectedItem = oEvent.getParameter("selectedItem");
                //oEvent.getSource().getBinding("items").filter([]);

                if (!oSelectedItem) {
                    return;
                }

                sDescription = oSelectedItem.getTitle();

                this.byId("rfqInput").setSelectedKey(sDescription);
                //this.byId("selectedKeyIndicator").setText(sDescription);
                this.getView().byId("RFQEventFilter").setVisible(true);
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
                            this.comparativeTableData = resp.value;
                        }

                    }.bind(this),
                    error: function (error) {
                        console.log(error);
                    }
                });



                var nfaModel = new JSONModel();
                this.getView().setModel(nfaModel, "nfaModel");

                let urlFilter = "?$filter=Ebeln eq '" + this.getView().byId("rfqInput").getSelectedKey() + "'";
                // var token = this.fetchToken();
                $.get({
                    url: this.appModulePath + "/comparative-analysis/mdNFADetails" + urlFilter,
                    success: function (resp) {
                        if (resp.value.length > 0) {
                            this.getView().getModel("nfaModel").setProperty("/", resp.value[0]);
                            this.getView().getModel("nfaModel").refresh();
                        } else {
                            // this.getView().byId("manualText1").setValue("");
                            // this.getView().byId("manualText2").setValue("");
                        }

                        this.getView().byId("manualText1").setEditable(true);
                        this.getView().byId("manualText2").setEditable(true);

                    }.bind(this),
                    error: function (error) {
                        console.log(error);
                    }
                });

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
                    { id: "otherExpenses", name: "Other Charges" },
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
                                if (costFields[j].id === "otherExpenses" || costFields[j].id === "comments") {
                                    productData[obj.vendorName] = obj[costFields[j].id];
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
                this.finalTableData = finalData;
                this.uniqueColumnData = uniqueColumnData;
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
                let aChangedData = this.getView().byId("compartiveTable").getModel().getProperty("/");
                let comparativeTableData = JSON.parse(JSON.stringify(this.comparativeTableData));
                // map changed table data with the backend structure
                for (let i = 0; i < comparativeTableData.length; i++) {
                    let commentData = aChangedData.find(item => item.item == (comparativeTableData[i].itemTitle + " (" + comparativeTableData[i].eventID + ")") && item.eventID == comparativeTableData[i].eventID && item["Item Description"] === "Comments");
                    comparativeTableData[i].comments = commentData[comparativeTableData[i].vendorName];
                    let otherCharges = aChangedData.find(item => item.item == (comparativeTableData[i].itemTitle + " (" + comparativeTableData[i].eventID + ")") && item.eventID == comparativeTableData[i].eventID && item["Item Description"] === "Other Charges");
                    comparativeTableData[i].otherExpenses = otherCharges[comparativeTableData[i].vendorName];
                    // delete comparativeTableData[i].modifiedBy;
                    // delete comparativeTableData[i].modifiedAt;
                    // delete comparativeTableData[i].createdAt;
                    // delete comparativeTableData[i].createdBy;
                }

                console.log(comparativeTableData);
                let sData = this.getView().getModel("nfaModel").getProperty("/");
                // let finalData = {
                //     "Ebeln": this.getView().byId("rfqInput").getSelectedKey(),
                //     "manualText1": this.getView().byId("manualText1").getValue(),
                //     "manualText2": this.getView().byId("manualText2").getValue()
                // };
                let finalData = JSON.parse(JSON.stringify(sData));
                finalData.mdItemDetails = comparativeTableData;
                var settings = {
                    async: false,
                    url: this.appModulePath + "/comparative-analysis/mdNFADetails",
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
                        if (errorMessage.startsWith("Entity already exists")) {
                            MessageBox.error("Entity already exists");
                            throw new Error("");
                        }
                        else {
                            MessageBox.error(error.responseText);
                            return;
                        }
                    }.bind(this));
            },

            // Function to print the NFA document
            onNFAPrint: function () {

                let tableData = this.finalTableData;
                let columnData = this.uniqueColumnData;
                let manualText1 = this.getView().byId("manualText1").getValue();
                let manualText2 = this.getView().byId("manualText2").getValue();

            }
        });
    });

