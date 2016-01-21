var tree = [
  {
    text: "Parent 1",
    href: "http://www.google.com",
    nodes: [
      {
        text: "Child 1",
        nodes: [
          {
            text: "Grandchild 1",
            href: "http://www.google.com",
          },
          {
            text: "Grandchild 2",
            href: "http://www.google.com",
          }
        ]
      },
      {
        text: "Child 2",
        href: "http://www.google.com"
      }
    ]
  },
  {
    text: "Parent 2",
    href: "http://www.google.com",
  },
  {
    text: "Parent 3",
    href: "http://www.google.com",
  },
  {
    text: "Parent 4",
    href: "http://www.google.com",
  },
  {
    text: "Parent 5",
    href: "http://www.google.com",
  }
];

$(document).on('ready',function(){

  $('#tree').treeview({
    data: tree,
    enableLinks: true
  });
});
