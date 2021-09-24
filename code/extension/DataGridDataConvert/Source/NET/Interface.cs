using System;
using System.Collections;
using System.Data;
using OutSystems.HubEdition.RuntimePlatform;

namespace OutSystems.NssDataGridDataConvert {

	public interface IssDataGridDataConvert {

		/// <summary>
		/// Prepares your data to be used in the Data Grid.
		/// </summary>
		/// <param name="ssData">List or record to get meta data from.</param>
		/// <param name="ssDataJSON">JSON with the data and metadata for the data grid</param>
		void MssConvertData2JSON(object ssData, out string ssDataJSON);

	} // IssDataGridDataConvert

} // OutSystems.NssDataGridDataConvert
