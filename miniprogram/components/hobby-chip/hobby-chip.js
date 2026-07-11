// components/hobby-chip/hobby-chip.js — 爱好 Chip 组件（增删）

Component({
  properties: {
    /** 爱好列表 */
    hobbies: {
      type: Array,
      value: [],
    },
    /** 是否可编辑 */
    editable: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    /** 是否显示添加输入框 */
    showAddInput: false,
    /** 新爱好输入值 */
    newHobby: '',
  },

  methods: {
    /** 显示添加输入框 */
    onShowAdd() {
      if (!this.properties.editable) return;
      this.setData({ showAddInput: true, newHobby: '' });
    },

    /** 隐藏添加输入框 */
    onCancelAdd() {
      this.setData({ showAddInput: false, newHobby: '' });
    },

    /** 输入新爱好 */
    onInput(e) {
      this.setData({ newHobby: e.detail.value.trim() });
    },

    /** 确认添加 */
    onConfirmAdd() {
      const hobby = this.data.newHobby;
      if (!hobby) return;

      const hobbies = [...this.properties.hobbies, hobby];
      this.setData({ showAddInput: false, newHobby: '' });
      this.triggerEvent('change', { hobbies });
    },

    /** 删除爱好 */
    onDelete(e) {
      const { index } = e.currentTarget.dataset;
      const hobbies = [...this.properties.hobbies];
      hobbies.splice(index, 1);
      this.triggerEvent('change', { hobbies });
    },
  },
});
