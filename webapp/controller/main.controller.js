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

                            let oTable = oDialog.getTable();
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
                            }

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
                //this.getView().byId("RFQEventFilter").setVisible(true);
                this.getView().byId("RFQEventFilterValueHelp").setEnabled(true);
                this.getView().byId("syncRFQEvents").setEnabled(true);
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
                let filters = "$filter=";
                for (let i = 0; i < selectedEvents.length; i++) {
                    filters = i ? filters + " or eventID eq '" + selectedEvents[i].getKey() + "'" : filters + "eventID eq '" + selectedEvents[i].getKey() + "'";
                    this.selectedEvents.push(selectedEvents[i].getKey());
                }
                var url = this.appModulePath + "/comparative-analysis/mdRFQEventItems?$expand=vendorTerms&" + filters;

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
                var mdColumns = [], uniquSKUs = [], mdUniqueVendorItems = [];
                var productData = {}, finalData = [];
                //Get Column list
                for (var item of mdData) {
                    if (!mdColumns.filter(function (obj) { return item.vendorName == obj.columnName }).length) {
                        mdColumns.push({ columnName: item.vendorName });
                    }
                    if (!mdUniqueVendorItems.filter(function (obj) { return item.vendorName == obj.vendorName && item.eventID == obj.eventID }).length) {
                        mdUniqueVendorItems.push(item);
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
                    { id: "remark", name: "Remark" },
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
                //console.log(finalData);
                //get terms and conditions for vendor
                for (let h in this.selectedEvents) {
                    let vendorList = mdUniqueVendorItems.filter(function (item) {
                        return item.eventID == this.selectedEvents[h];
                    }.bind(this));
                    let vendorTerms = {};
                    vendorTerms["item"] = "Terms " + this.selectedEvents[h];
                    vendorTerms["Item Description"] = "General Terms and Conditions";
                    for (let k in mdUniqueVendorItems) {
                        vendorTerms[mdUniqueVendorItems[k].vendorTerms.vendorName] = mdUniqueVendorItems[k].vendorTerms.generalTerms;
                    }
                    vendorTerms.ediable = false;
                    finalData.push(vendorTerms);
                }

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
                            editable: "{editable}",
                            wrapping: true
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
                const csTableData = this.finalTableData;
                const csTableColumns = this.uniqueColumnData;
                const manualText1 = this.getView().byId("manualText1").getValue();
                const manualText2 = this.getView().byId("manualText2").getValue();
                // TODO: Update this data once get the actual data
                const termsAndConditions = "The Specification, General terms and Conditions shall be as Under";

                const currentDate = new Date().toLocaleDateString("en-GB")

                const cssVariables = `--padding-buffer: 10px;`;
                const tableStyle = "border-collapse: collapse;table-layout: fixed;width: 100%;font-size: 1vw;"
                const cellStyle = "padding: 10px;word-wrap:break-word;";

                // #region - Company Logo
                const companyLogo = `<img src="data:image/png;base64,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" alt="Company Logo" style="height: 40px;width: auto;" />`;

                //#endregion
                const nfaTemplate = /* HTML */ `
                    <div style="display:flex;flex-direction:column;margin: auto;padding: 30px;font-size: 15px;line-height: 24px;    font-family: &quot;Helvetica Neue&quot;, &quot;Helvetica&quot;, Helvetica, Arial, sans-serif;color: #555;${cssVariables}">
                        <!-- Header content -->
                        <h1 id="main-heading"
                            style="margin-top: 0;font-size: 1.4em;display: flex;justify-content: center;align-items: center;gap: var(--padding-buffer);">
                                    ${companyLogo}
                            CHAMBAL FERTILISERS AND CHEMICALS LIMITED
                        </h1>
                        <hr style="width: 100%" /> 

                        <!-- Date -->
                        <div style="display: flex; justify-content: space-between; margin: 0px var(--padding-buffer);">
                            <h4>Date: <span style="font-weight: 200;">${currentDate}</span></h4>
                        </div>
                        
                        <!-- Dynamic Text field 1 -->
                        <div style="padding: var(--padding-buffer)">${manualText1 || ""}</div>
                        
                        <!-- Comparative Analysis table -->
                        <div style="display: flex;flex-direction: column; --border-size: 1px; padding: var(--padding-buffer)">
                            <h4 style="margin: 0">Comparative Analysis</h4>    
                            <table border="1" style="${tableStyle}">
                                <thead>
                                    <tr>
                                        ${csTableColumns.reduce((acc, curr) => acc += `<th style="${cellStyle}">${curr.columnName}</th>`, "")}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${csTableData?.reduce((accRow, curRow) => {
                    return (accRow += `<tr>${csTableColumns?.reduce((accCell, curCell, index) => {
                        return (accCell += `<td style="${cellStyle}">${curRow[curCell.columnName] || "-"}</td>`);
                    }, "")}</tr>`);
                }, "")}
                                </tbody>
                            </table>
                        </div>

                        <!-- Dynamic Text field 2 -->
                        <div style="padding: var(--padding-buffer)">${manualText2 || ""}</div>

                        <!-- Terms & conditions -->
                        <div style="padding: var(--padding-buffer)">${termsAndConditions || ""}</div>

                        
                        <div style="padding: var(--padding-buffer)"><h4>Please Approve</h4></div>

                    </div>
                    `

                const win = window.open();
                const style = document.createElement('style');
                style.textContent = `@page{size: landscape;}`;
                win.document.write(nfaTemplate);
                win.document.title = data.Ebeln + " NFA Purchase Department";
                win.document.querySelector("head").appendChild(style);
                win.print();
                // //win.close();
            },

            handleSyncRFQEvent: function (oEvent) {
                if (this.getView().byId("rfqInput").getSelectedKey()) {
                    var data = {
                        "rfq": this.getView().byId("rfqInput").getSelectedKey()
                    }
                    // var token = this.fetchToken();
                    var settings = {
                        async: true,
                        url: this.appModulePath + "/comparative-analysis/mdStageEvents",
                        method: "POST",
                        headers: {
                            "content-type": "application/json"
                        },
                        processData: false,
                        data: JSON.stringify(data)
                    };
                     this.getView().setBusy(true);
                    $.ajax(settings)
                        .done(function (response) {
                            this.getView().setBusy(false);
                            MessageBox.success("Successfully Events and awarded scenarios are synced");
                        }.bind(this)).fail(function () {
                            this.getView().setBusy(false);
                            MessageBox.error(error.responseText);
                        });
                }
            },

            handlePressSyncRfq: function () {
                let sParams = {};
                sParams.sPath = '/comparative-analysis/updateRFQList';
                sParams.data = {}
                sParams.method = 'POST';

                let nePromise = new Promise(function (resolve, reject) {
                    this.callAjax(sParams, resolve, reject);
                }.bind(this));
                nePromise.then(function (data) {
                    let sMsg = "Data has been Synced";
                    if (data.value) {
                        sMsg = data.value;
                    }
                    sap.m.MessageBox.success(sMsg);
                }.bind(this));
            },

            callAjax: function (sParams, resolve, reject) {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);
                var settings = {
                    async: true,
                    url: appModulePath + sParams.sPath,
                    method: sParams.method,
                    headers: {
                        "content-type": "application/json"
                    },
                    processData: false,
                    data: JSON.stringify(sParams.data)
                };
                this.getView().setBusy(true);
                $.ajax(settings)
                    .done(function (data) {
                        this.getView().setBusy(false);
                        if (resolve) {
                            resolve(data);
                        } else {
                            this.onGoButtonPress();
                            sap.m.MessageBox.success("Data has been Synced");
    
                        }
                    }.bind(this)
                    )
                    .fail(function (oError) {
                        this.getView().setBusy(false);
                        if (reject) {
                            reject();
                        }
                        console.log(oError);
                        MessageBox.error("1: Error while Sync please try again");
                    }.bind(this));
            }
        });
    });

