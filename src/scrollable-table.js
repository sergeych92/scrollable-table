(function () {
	ko.bindingHandlers.afterForeachDomUpdate = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			var arg = valueAccessor(),
				func = typeof arg === 'function' ? arg : function ()  {};
			allBindings().foreach.subscribe(function (newValue) {
				func();
			});
			func();
    }
	};

	var tableTemplate =
		'<table class="container-table">' +
		  '<tr>' +
		    '<td>' +
		       '<table class="head-table">' +
		       '</table>' +
		    '</td>' +
				'<td class="scroll-space" style="width: 0"></td>' +
		  '</tr>' +
		  '<tr>' +
		    '<td colspan="2">' +
		       '<div class="body-table-container">' +
		         '<table class="body-table">' +
		         '</table>' +
		       '</div>' +
		    '</td>' +
		  '</tr>' +
		'</table>';

	function clean(node) {
		for(var n = 0; n < node.childNodes.length; n ++) {
			var child = node.childNodes[n];
			if (child.nodeType === 8 ||
				(child.nodeType === 3 && !/\S/.test(child.nodeValue)))
			{
				node.removeChild(child);
				n --;
			}
			else if(child.nodeType === 1) {
				clean(child);
			}
		}
	}

	function validateSourceTemplateStructure(el) {
		if (el.childElementCount !== 1 || el.firstChild.tagName.toLowerCase() !== 'table')
			throw new Error("There must be only one child table in the container and it must be an immidiate child.");

		if (el.querySelectorAll('thead th').length < 1)
			throw new Error("The table must have at least one th element.");

		if (el.querySelectorAll('tbody td').length < 1)
			throw new Error("The table must have at least one td element.");

		if (el.querySelectorAll('tbody td').length !== el.querySelectorAll('thead th').length)
			throw new Error("The number of th and td elements must match.");
	}

	function createFooter(el) {
		var columnNum = el.querySelectorAll('.head-table tr:last-child th').length;
		var footer = document.createElement('tfoot');
		var tr = document.createElement('tr');
		footer.appendChild(tr);
		for (var i = 1; i <= columnNum; i++) {
			tr.appendChild(document.createElement('td'));
		}
		return footer;
	}

	function showFooter(selectors, height) {
		selectors.footer.style.display = "table-row-group";
		selectors.footerRow.style.height = height + 'px';
	}

	function hideFooter(selectors) {
		selectors.footer.style.display = "none";
		selectors.footerRow.style.height = 0;
	}

	function wrapUpIntoTemplate(el) {
		el.className += 'container';

		// Init a document fragment with a prepared html template.
		var frg = document.createDocumentFragment();
		frg.appendChild(document.createElement('div'));
		frg.firstChild.innerHTML = tableTemplate;
		frg.appendChild(frg.firstChild.firstChild);
		frg.removeChild(frg.firstChild);

		// Copy exising classes into the root.
		frg.firstChild.className += el.firstChild.className;

		// Clone and move the exsiting head.
		var theadClone = el.querySelector('table thead').cloneNode(true);
		frg.querySelector('.head-table').appendChild(theadClone);

		// Clone and move the existing body.
		var tbodyClone = el.querySelector('table tbody').cloneNode(true);
		tbodyClone.setAttribute('data-bind', 'foreach: rows, afterForeachDomUpdate: afterDomUpdate');
		var tbody = frg.querySelector('.body-table');
		tbody.appendChild(tbodyClone);
		tbody.appendChild(createFooter(frg));
		hideFooter({
			footer: frg.querySelector('.body-table tfoot'),
			footerRow: frg.querySelector('.body-table tfoot tr')
		});

		el.replaceChild(frg, el.firstChild);

		return {
			headerTable: el.querySelector('.head-table'),
			scrollSpace: el.querySelector('.scroll-space'),
			bodyContainer: el.querySelector('.body-table-container'),
			bodyTable: el.querySelector('.body-table'),
			body: el.querySelector('.body-table tbody'),
			footer: el.querySelector('.body-table tfoot'),
			footerRow: el.querySelector('.body-table tfoot tr')
		};
	}

	function setScrollWidth(selectors) {
		var widthDiff = selectors.bodyContainer.offsetWidth - selectors.bodyTable.offsetWidth;
		selectors.scrollSpace.style.width = widthDiff + 'px';
	}

	function drawBottomLines(selectors) {
		var heightDiff = selectors.bodyContainer.offsetHeight - selectors.body.offsetHeight;
		if (heightDiff > 0) {
			showFooter(selectors, heightDiff);
		} else {
			hideFooter(selectors);
		}
	}

	ko.bindingHandlers.scrollableTable = {
	    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
				clean(element);
				validateSourceTemplateStructure(element);
				var selectors = wrapUpIntoTemplate(element);

				var innerBindingContext = bindingContext.extend({
					rows: valueAccessor(),
					afterDomUpdate: function () {
						setScrollWidth(selectors);
						drawBottomLines(selectors);
					}
				});
				ko.applyBindingsToDescendants(innerBindingContext, element);

				return { controlsDescendantBindings: true };
	    },
	    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
	    }
	};
})();
